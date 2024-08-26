import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "felipe",
  host: "dpg-cqtnearv2p9s73dkbnug-a.oregon-postgres.render.com",
  database: "totpdb",
  password: "wZyC5pIvPW7CdEGDSE6N9wmwIrH5nOE1",
  port: 5432,
});

export default pool;
