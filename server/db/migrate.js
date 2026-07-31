import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("SUPABASE_DB_URL 환경 변수가 필요합니다.");
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  await client.query(sql);
  console.log("마이그레이션 완료: profiles, saved_recipes 테이블 생성됨");
  await client.end();
}

main().catch((err) => {
  console.error("마이그레이션 실패:", err.message);
  process.exit(1);
});
