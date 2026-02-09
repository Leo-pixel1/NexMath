/* ================= NAVEGACIÓN ================= */
function mostrar(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("active");
    window.scrollTo(0, 0);
    if (id === "cursos") filtrarCursos();
  }
}

/* ================= REGISTRO ================= */
async function registrar() {
  const datos = {
    nombre: document.getElementById("nombre").value.trim(),
    edad: document.getElementById("edad").value,
    grado: document.getElementById("grado").value.trim(),
    colegio: document.getElementById("colegio").value.trim(),
    ciudad: document.getElementById("ciudad").value.trim(),
    pais: document.getElementById("pais").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value
  };

  // Validación mínima
  if (
    !datos.nombre || !datos.email || !datos.password ||
    !datos.grado || !datos.colegio || !datos.ciudad || !datos.pais
  ) {
    alert("Completa todos los campos");
    return;
  }

  // Enviar al servidor
  try {
    const res = await fetch("/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    const r = await res.json();

    if (r.ok) {
      // Guardar perfil para filtrar cursos localmente
      localStorage.setItem("perfil", JSON.stringify({
        grado: datos.grado.toLowerCase(),
        colegio: datos.colegio.toLowerCase()
      }));

      alert("Registro exitoso. Bienvenido a NexMath");
      mostrar("principal");
    } else {
      // servidor devuelve mensaje cuando email ya existe o error
      alert(r.mensaje || "Error al registrar");
    }
  } catch (e) {
    alert("Error de conexión con el servidor");
  }
}

/* ================= LOGIN ================= */
function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPass").value.trim();

  if (!email || !password) {
    alert("Ingresa correo y contraseña");
    return;
  }

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  .then(r => r.json())
  .then(d => {
    if (d.acceso) {
      // si quieres, cargar perfil desde servidor más adelante
      mostrar("principal");
    } else {
      alert("Correo o contraseña incorrectos");
    }
  })
  .catch(() => alert("Error de conexión"));
}

/* ================= FILTRO DE CURSOS ================= */
function filtrarCursos() {
  const raw = localStorage.getItem("perfil");
  if (!raw) {
    document.querySelectorAll(".course").forEach(c => c.style.display = "block");
    return;
  }

  const perfil = JSON.parse(raw);
  const grado = (perfil.grado || "").toLowerCase();
  const colegio = (perfil.colegio || "").toLowerCase();

  document.querySelectorAll(".course").forEach(c => c.style.display = "none");

  // PRIMARIA
  if (grado.includes("primaria")) {
    if (colegio.includes("innova")) {
      // mostrar solo singapur primaria
      document.querySelectorAll(".course.primaria.singapur")
        .forEach(c => c.style.display = "block");
    } else {
      // mostrar solo primaria tradicional
      document.querySelectorAll(".course.primaria.tradicional")
        .forEach(c => c.style.display = "block");
    }
    return;
  }

  // SECUNDARIA
  if (grado.includes("secundaria")) {
    const match = grado.match(/\d+/);
    const num = match ? parseInt(match[0]) : null;

    // Mostrar siempre los cursos generales de secundaria (aritmética, geometría, álgebra)
    document.querySelectorAll(".course.secundaria").forEach(c => c.style.display = "block");

    if (num && num >= 3) {
      // mostrar secundaria alta
      document.querySelectorAll(".course.secundaria-alta").forEach(c => c.style.display = "block");
    }

    return;
  }

  // fallback: mostrar todos
  document.querySelectorAll(".course").forEach(c => c.style.display = "block");
}