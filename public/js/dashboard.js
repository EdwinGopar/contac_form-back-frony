let currentStatus = 'nuevo';
let leads = [];

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("No estás autenticado.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("http://localhost:3001/api/contact", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al cargar leads");

    leads = data;
    loadLeads(currentStatus); // Mostrar por defecto los nuevos
  } catch (err) {
    console.error("❌ Error al obtener leads:", err);
    alert("Error al cargar leads.");
  }
});

function loadLeads(status) {
  currentStatus = status;

  // Marcar activo el link del sidebar
  document.querySelectorAll(".sidebar a").forEach(a => a.classList.remove("active"));
  document.querySelectorAll(".sidebar a").forEach(a => {
    if (a.textContent.toLowerCase().includes(status)) a.classList.add("active");
  });

  const tableBody = document.getElementById("leadTableBody");
  tableBody.innerHTML = "";

  const filtrados = leads.filter(l => (l.status || "nuevo").toLowerCase() === status.toLowerCase());

  if (filtrados.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6">No hay leads en esta categoría</td></tr>`;
    return;
  }

  filtrados.forEach(lead => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${lead.name || '—'}</td>
      <td>${lead.email || '—'}</td>
      <td>${lead.phone || '—'}</td>
      <td>${lead.message || '—'}</td>
      <td>${lead.status || 'Nuevo'}</td>
      <td>
        ${lead.status !== 'contactado' ? `<button class="status-btn" onclick="cambiarEstado(${lead.id}, 'contactado')">Contactado</button>` : ''}
        ${lead.status !== 'descartado' ? `<button class="delete-btn" onclick="cambiarEstado(${lead.id}, 'descartado')">Descartar</button>` : ''}
      </td>
    `;
    tableBody.appendChild(row);
  });
}

async function cambiarEstado(id, nuevoEstado) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`http://localhost:3001/api/contact/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: nuevoEstado })
    });

    const data = await res.json();

    if (res.ok) {
      const index = leads.findIndex(l => l.id === id);
      if (index !== -1) {
        leads[index].status = nuevoEstado;

        // Enviar correo de notificación
        enviarCorreoLead(leads[index]);

        loadLeads(currentStatus);
      }
    } else {
      alert(data.error || "Error al cambiar el estado");
    }
  } catch (err) {
    console.error("❌ Error al cambiar estado:", err);
    alert("Ocurrió un error");
  }
}

function enviarCorreoLead(lead) {
  if (!window.emailjs) {
    console.error("❌ EmailJS no está definido.");
    return;
  }

  emailjs.send("service_xudsnpt", "template_xgc5vpp", {
    nombre: lead.name || '',
    mensaje: lead.message || '',
    correo: lead.email || '',
    telefono: lead.phone || '',
    estado: lead.status || '',
    email: lead.email || '',
    name: lead.name || '',
  }).then(function (response) {
    console.log("✅ Correo enviado:", response.status);
  }, function (error) {
    console.error("❌ Error al enviar correo:", error);
  });
}

// Cierre de sesión
document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

// 💡 Hacer accesibles funciones para eventos onclick inline
window.loadLeads = loadLeads;
window.cambiarEstado = cambiarEstado;
