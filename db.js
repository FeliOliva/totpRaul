import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "felipe",
  host: "dpg-cqtnearv2p9s73dkbnug-a.oregon-postgres.render.com", // Host completo
  database: "totpdb",
  password: "wZyC5pIvPW7CdEGDSE6N9wmwIrH5nOE1", // Asegúrate de usar la contraseña correcta
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;
