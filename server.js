const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const url = require("node:url");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

const PORT = Number(process.env.PORT || 3000);
const DB_NAME = process.env.PGDATABASE || "minecraft";
const HOST = process.env.HOST || "127.0.0.1";
const INDEX_PATH = path.join(process.cwd(), "index.html");

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end(JSON.stringify(payload));
}

function sendHtml(res, statusCode, html) {
    res.writeHead(statusCode, {
        "Content-Type": "text/html; charset=utf-8"
    });
    res.end(html);
}

function parseValue(raw, type) {
    if (raw === "" || raw === null || raw === undefined) return null;
    if (type === "number") return Number(raw);
    if (type === "boolean") return raw === "t";
    return raw;
}

function parseRows(stdout, columns) {
    const trimmed = stdout.trim();
    if (!trimmed) return [];

    return trimmed.split("\n").map((line) => {
        const parts = line.split("\t");
        const obj = {};
        columns.forEach((column, index) => {
            obj[column.key] = parseValue(parts[index], column.type);
        });
        return obj;
    });
}

function runSql(sql, variables = {}) {
    const args = [
        "-d", DB_NAME,
        "-X",
        "-q",
        "-A",
        "-t",
        "-F", "\t",
        "--pset", "footer=off",
        "-v", "ON_ERROR_STOP=1"
    ];

    Object.entries(variables).forEach(([name, value]) => {
        args.push("-v", `${name}=${value}`);
    });

    args.push("-c", sql);
    return execFileAsync("psql", args, { maxBuffer: 1024 * 1024 * 8 });
}

async function searchItems(query) {
    const sql = `
        SELECT name
        FROM public.item
        WHERE name ILIKE '%' || :'q' || '%'
        ORDER BY name
        LIMIT 10;
    `;

    const { stdout } = await runSql(sql, { q: query });
    const rows = parseRows(stdout, [{ key: "name", type: "text" }]);
    return rows.map((row) => row.name);
}

async function getItemByName(name) {
    const sql = `
        SELECT
            name,
            max_stack,
            rarity,
            mining_level,
            attack_damage,
            attack_speed,
            renewable,
            fire_resistant,
            blast_resistant
        FROM public.item
        WHERE lower(name) = lower(:'name')
        LIMIT 1;
    `;

    const { stdout } = await runSql(sql, { name });
    const rows = parseRows(stdout, [
        { key: "name", type: "text" },
        { key: "max_stack", type: "number" },
        { key: "rarity", type: "text" },
        { key: "mining_level", type: "number" },
        { key: "attack_damage", type: "number" },
        { key: "attack_speed", type: "number" },
        { key: "renewable", type: "boolean" },
        { key: "fire_resistant", type: "boolean" },
        { key: "blast_resistant", type: "boolean" }
    ]);

    return rows[0] || null;
}

const server = http.createServer(async (req, res) => {
    if (!req.url) {
        sendJson(res, 400, { error: "Bad request" });
        return;
    }

    if (req.method === "OPTIONS") {
        sendJson(res, 204, {});
        return;
    }

    const parsed = url.parse(req.url, true);

    if (req.method === "GET" && (parsed.pathname === "/" || parsed.pathname === "/index.html")) {
        try {
            const html = fs.readFileSync(INDEX_PATH, "utf8");
            sendHtml(res, 200, html);
        } catch (error) {
            sendJson(res, 500, { error: "Failed to load index.html", details: String(error) });
        }
        return;
    }

    if (req.method === "GET" && parsed.pathname === "/api/items/search") {
        const query = (parsed.query.q || "").toString().trim();
        if (!query) {
            sendJson(res, 200, { items: [] });
            return;
        }

        try {
            const items = await searchItems(query);
            sendJson(res, 200, { items });
        } catch (error) {
            sendJson(res, 500, { error: "Search failed", details: String(error.message || error) });
        }
        return;
    }

    if (req.method === "GET" && parsed.pathname === "/api/items/compare") {
        const item1Name = (parsed.query.item1 || "").toString().trim();
        const item2Name = (parsed.query.item2 || "").toString().trim();

        if (!item1Name || !item2Name) {
            sendJson(res, 400, { error: "Both item1 and item2 are required." });
            return;
        }

        try {
            const [item1, item2] = await Promise.all([
                getItemByName(item1Name),
                getItemByName(item2Name)
            ]);

            sendJson(res, 200, { item1, item2 });
        } catch (error) {
            sendJson(res, 500, { error: "Compare failed", details: String(error.message || error) });
        }
        return;
    }

    sendJson(res, 404, { error: "Not found" });
});

server.on("error", (error) => {
    process.stderr.write(`Server failed to start: ${String(error.message || error)}\n`);
    process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
    process.stdout.write(
        `Server running at http://${HOST}:${PORT} using database "${DB_NAME}"\n`
    );
});
