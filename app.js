const bankSelect = document.getElementById("bank");
const productSelect = document.getElementById("product");
const productWrapper = document.getElementById("product-wrapper");

const table = document.getElementById("fd-table");
const thead = table.querySelector("thead");
const tbody = table.querySelector("tbody");
const titleEl = document.getElementById("page-title");

/* ---------------------------------
   PRODUCT CONFIG
---------------------------------- */
const PRODUCTS = {
  axis: [
    {
      value: "domestic",
      label: "Callable",
      file: "data/banks/axis_domestic_fd.json"
    },
    {
      value: "plusa",
      label: "Non-Callable",
      file: "data/banks/axis_plusa_fd.json"
    }
  ],

  hdfc: [
    {
      value: "domestic",
      label: "Callable",
      file: "data/banks/hdfc_domestic_fd.json"
    },
    {
      value: "domestic_plus",
      label: "Non-Callable",
      file: "data/banks/hdfc_domestic_plus_fd.json"
    }
  ],

  kotak: [
    {
      value: "domestic",
      label: "Callable",
      file: "data/banks/kotak_domestic_fd.json"
    },
    {
      value: "domestic_plus",
      label: "Non-Callable",
      file: "data/banks/kotak_domestic_plus_fd.json"
    }
  ]
};

/* ---------------------------------
   Populate Product Dropdown
---------------------------------- */
function updateProductOptions() {
  const bank = bankSelect.value;
  productSelect.innerHTML = "";

  PRODUCTS[bank].forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.value;
    opt.textContent = p.label;
    productSelect.appendChild(opt);
  });
}

/* ---------------------------------
   Load FD Data
---------------------------------- */
async function loadFD() {
  const bank = bankSelect.value;
  const product = productSelect.value;

  const config = PRODUCTS[bank].find(p => p.value === product);
  if (!config) return;

  // ---------- Heading ----------
  const bankNameMap = {
    axis: "Axis Bank",
    hdfc: "HDFC Bank",
    kotak: "Kotak Mahindra Bank"
  };

  titleEl.textContent = `${bankNameMap[bank]} – ${config.label}`;

  // ---------- Fetch ----------
  const res = await fetch(config.file);
  const data = await res.json();

  const tenures = data.tenures || data.rates || [];

  // ---------- Collect slabs ----------
  const slabSet = new Set();
  tenures.forEach(t => {
    Object.keys(t.slabs || {}).forEach(s => slabSet.add(s));
  });

  const slabs = Array.from(slabSet);

  // ---------- Build Header ----------
  thead.innerHTML = "";
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `<th>Tenure</th>`;

  slabs.forEach(slab => {
    headerRow.innerHTML += `<th>${slab} (General)</th>`;
    headerRow.innerHTML += `<th>${slab} (Senior)</th>`;
  });

  thead.appendChild(headerRow);

  // ---------- Build Body ----------
  tbody.innerHTML = "";

  tenures.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.tenure}</td>`;

    slabs.forEach(slab => {
      const d = item.slabs?.[slab] || {};
      tr.innerHTML += `<td>${d.general ?? "-"}</td>`;
      tr.innerHTML += `<td>${d.senior ?? "-"}</td>`;
    });

    tbody.appendChild(tr);
  });
}

/* ---------------------------------
   Events
---------------------------------- */
bankSelect.addEventListener("change", () => {
  updateProductOptions();
  loadFD();
});

productSelect.addEventListener("change", loadFD);

/* ---------------------------------
   Initial Load
---------------------------------- */
updateProductOptions();
loadFD();

