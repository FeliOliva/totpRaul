import React, { useState } from "react";

function QRForm() {
  const [emailuser, setEmailuser] = useState("");
  const [appname, setAppname] = useState("");
  const [qrCode, setQrCode] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const response = await fetch("http://localhost:3000/generate-qr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emailuser, appname }),
    });

    const data = await response.json();

    if (response.ok) {
      setQrCode(data.qrcode);
    } else {
      alert(data.error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Email"
          value={emailuser}
          onChange={(e) => setEmailuser(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Nombre de la Aplicación"
          value={appname}
          onChange={(e) => setAppname(e.target.value)}
          required
        />
        <button type="submit">Generar QR</button>
      </form>
      {qrCode && (
        <div>
          <h3>QR Code</h3>
          <img src={qrCode} alt="QR Code" />
        </div>
      )}
    </div>
  );
}

export default QRForm;
