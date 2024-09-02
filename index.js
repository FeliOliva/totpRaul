import express from "express";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import qrcodeTerminal from "qrcode-terminal";
import pool from "./db.js";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

let secret;

app.post("/generate-qr", async (req, res) => {
  try {
    const { emailuser, appname } = req.body;
    if (!emailuser || !appname) {
      return res
        .status(400)
        .json({ error: "Email y nombre de la aplicación son requeridos" });
    }

    const secret = speakeasy.generateSecret({ length: 20 });
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: `${appname}:${emailuser}`,
      issuer: "empresa",
      encoding: "base32",
    });

    const client = await pool.connect(); // Conectar al pool
    try {
      const existingUser = await client.query(
        "SELECT * FROM users WHERE emailuser = $1 AND appname = $2",
        [emailuser, appname]
      );

      if (existingUser.rows.length > 0) {
        await client.query(
          "UPDATE users SET secret = $1 WHERE emailuser = $2 AND appname = $3",
          [secret.base32, emailuser, appname]
        );
      } else {
        await client.query(
          "INSERT INTO users (secret, emailuser, appname, create_time) VALUES ($1, $2, $3, NOW())",
          [secret.base32, emailuser, appname]
        );
      }

      qrcodeTerminal.generate(otpauthUrl, { small: true }, function (qrcode) {
        console.log("QR");
        console.log(qrcode);
      });

      qrcode.toDataURL(otpauthUrl, (err, data_url) => {
        if (err) {
          res.status(500).json({ error: "Error generando QR" });
        } else {
          res.json({ secret: secret.base32, qrcode: data_url });
        }
      });
    } finally {
      client.release(); // Asegúrate de liberar el cliente de nuevo al pool
    }
  } catch (error) {
    console.error("Error al guardar en la base de datos:", error);
    res.status(500).json({ error: "Error al guardar en la base de datos" });
  }
});

app.post("/verify-totp", async (req, res) => {
  const { token, emailuser, appname } = req.body;

  try {
    const result = await pool.query(
      "SELECT secret FROM users WHERE emailuser = $1 AND appname = $2",
      [emailuser, appname]
    );

    if (result.rows.length === 0) {
      return res.status(400).send("Usuario o aplicación no encontrados.");
    }

    const userSecret = result.rows[0].secret;

    const verified = speakeasy.totp.verify({
      secret: userSecret,
      encoding: "base32",
      token: token,
    });

    if (verified) {
      res.send("🤙🏼🤙🏼🤙🏼🤙🏼");
    } else {
      res.status(400).send("👎🏼👎🏼👎🏼👎🏼");
    }
  } catch (error) {
    console.error("Error al verificar el TOTP:", error);
    res.status(500).json({ error: "Error al verificar el TOTP" });
  }
});

app.get("/generate-totp", (req, res) => {
  if (!secret) {
    return res.status(400).send("Secret no definido. Generar QR primero.");
  }
  const token = speakeasy.totp({ secret: secret.base32, encoding: "base32" });
  res.json({ token });
});

app.listen(3000, () => console.log("Server en port 3000..."));
