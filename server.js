const express = require("express");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const app = express();
app.use(express.json());
app.use(express.static("public")); // si tus archivos están en public/

const CSV = path.join(__dirname, "usuarios.csv");
const XLS = path.join(__dirname, "registros.xlsx");
const ADMIN_KEY = "admin123";

// crear CSV con header si no existe
if (!fs.existsSync(CSV)) {
  fs.writeFileSync(CSV, "Nombre,Edad,Grado,Colegio,Ciudad,Pais,Email,Password\n", "utf8");
}

function readUsers() {
  const raw = fs.readFileSync(CSV, "utf8").trim();
  if (!raw) return [];
  const lines = raw.split("\n").slice(1).filter(Boolean);
  return lines.map(l => {
    const c = l.split(",");
    return {
      Nombre: (c[0] || "").trim(),
      Edad: (c[1] || "").trim(),
      Grado: (c[2] || "").trim(),
      Colegio: (c[3] || "").trim(),
      Ciudad: (c[4] || "").trim(),
      Pais: (c[5] || "").trim(),
      Email: (c[6] || "").trim(),
      Password: (c[7] || "").trim()
    };
  });
}

function writeExcel() {
  try {
    const users = readUsers();
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(users);
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
    XLSX.writeFile(wb, XLS);
  } catch (e) {
    console.log("No se pudo actualizar XLSX (está abierto?)", e.message);
  }
}

app.post("/registro", (req, res) => {
  const d = req.body || {};
  const required = ["nombre","email","password","grado","colegio","ciudad","pais"];
  for (let r of required) {
    if (!d[r] || String(d[r]).trim() === "") {
      return res.json({ ok: false, mensaje: "Faltan campos obligatorios" });
    }
  }

  const email = String(d.email).trim().toLowerCase();

  // comprobar duplicado (case-insensitive)
  const usuarios = readUsers();
  const existe = usuarios.some(u => String(u.Email || "").toLowerCase() === email);
  if (existe) {
    return res.json({ ok: false, mensaje: "Este correo ya está registrado" });
  }

  // preparar fila CSV (sin comillas para simplicidad; evita comas en campos)
  const row = [
    d.nombre || "",
    d.edad || "",
    d.grado || "",
    d.colegio || "",
    d.ciudad || "",
    d.pais || "",
    d.email || "",
    d.password || ""
  ].join(",") + "\n";

  try {
    fs.appendFileSync(CSV, row, "utf8");
    writeExcel();
    return res.json({ ok: true });
  } catch (e) {
    console.error("Error al escribir CSV:", e);
    return res.json({ ok: false, mensaje: "Error interno al guardar. Cierra Excel si lo tienes abierto." });
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.json({ acceso: false });

  const usuarios = readUsers();
  const ok = usuarios.some(u => (u.Email || "").toLowerCase() === String(email).toLowerCase() && (u.Password || "") === password);
  res.json({ acceso: !!ok });
});

/* ADMIN (descargas) */
app.get("/admin", (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.sendStatus(403);
  res.send(`
    <h2>Admin NexMath</h2>
    <p><a href="/admin/csv?key=${ADMIN_KEY}">Descargar CSV</a></p>
    <p><a href="/admin/xlsx?key=${ADMIN_KEY}">Descargar Excel</a></p>
  `);
});

app.get("/admin/csv", (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.sendStatus(403);
  res.download(CSV);
});

app.get("/admin/xlsx", (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.sendStatus(403);
  res.download(XLS);
});

app.listen(3000, () => console.log("Servidor activo http://localhost:3000"));