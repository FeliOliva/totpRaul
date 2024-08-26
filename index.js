import express from "express";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import qrcodeTerminal from "qrcode-terminal";
import pool from "./db.js";

const app = express();
app.use(express.json());

let secret;

app.post("/generate-qr", async (req, res) => {
  const { emailuser, appname } = req.body;

  if (!emailuser || !appname) {
    return res
      .status(400)
      .json({ error: "Email y nombre de la aplicación son requeridos" });
  }

  const secret = speakeasy.generateSecret({ length: 20 });
  console.log("secret: ", secret);

  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret.base32,
    label: `${appname}:${emailuser}`,
    issuer: "empresa",
    encoding: "base32",
  });
  console.log("otpauthUrl: ", otpauthUrl);

  try {
    // Verifica si ya existe un registro con el mismo email y appname
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE emailuser = $1 AND appname = $2",
      [emailuser, appname]
    );

    if (existingUser.rows.length > 0) {
      // Actualiza el secret existente y el updatedAt
      await pool.query(
        "UPDATE users SET secret = $1, updatedAt = NOW() WHERE emailuser = $2 AND appname = $3",
        [secret.base32, emailuser, appname]
      );
    } else {
      // Inserta un nuevo registro
      await pool.query(
        "INSERT INTO users (secret, emailuser, appname, createdAt, updatedAt) VALUES ($1, $2, $3, NOW(), NOW())",
        [secret.base32, emailuser, appname]
      );
    }

    // Genera el QR en la terminal
    qrcodeTerminal.generate(otpauthUrl, { small: true }, function (qrcode) {
      console.log("QR");
      console.log(qrcode);
    });

    // Genera el QR en formato data URL
    qrcode.toDataURL(otpauthUrl, (err, data_url) => {
      if (err) {
        res.status(500).json({ error: "Error generando QR" });
      } else {
        res.json({ secret: secret.base32, qrcode: data_url });
      }
    });
  } catch (error) {
    console.error("Error al guardar en la base de datos:", error);
    res.status(500).json({ error: "Error al guardar en la base de datos" });
  }
});

app.post("/verify-totp", (req, res) => {
  const { token } = req.body;

  if (!secret) {
    return res.status(400).send("Secret no definido. Generar QR primero.");
  }

  const verified = speakeasy.totp.verify({
    secret: secret.base32,
    encoding: "base32",
    token: token,
  });

  if (verified) {
    res.send("🤙🏼🤙🏼🤙🏼🤙🏼");
  } else {
    res.status(400).send("👎🏼👎🏼👎🏼👎🏼");
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
