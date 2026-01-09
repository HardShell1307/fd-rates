const bankSelect = document.getElementById("bank");
const productSelect = document.getElementById("product");

const tenureFilter = document.getElementById("filter-tenure");
const amountFilter = document.getElementById("filter-amount");

const table = document.getElementById("fd-table");
const thead = table.querySelector("thead");
const tbody = table.querySelector("tbody");
const titleEl = document.getElementById("page-title");

/* ---------------------------------
   PRODUCT CONFIG
---------------------------------- */
const PRODUCTS = {
  axis: [
    { value: "domestic", label: "Callable", file: "data/banks/axis_domestic_fd.json" },
    { value: "plusa", label: "Non-Callable", file: "data/banks/axis_plusa_fd.json" }
  ],
  hdfc: [
    { value: "domestic", label: "Callable", file: "data/banks/hdfc_domestic_fd.json" },
    { value: "domestic_plus", label: "Non-Callable", file: "data/banks/hdfc_domestic_plus_fd.json" }
  ],
  kotak: [
    { value: "domestic", label: "Callable", file: "data/banks/kotak_domestic_fd.json" },
    { value: "domestic_plus", label: "Non-Callable", file: "data/banks/kotak_domestic_plus_fd.json" }
  ]
};

const BANK_NAMES = {
  axis: "Axis Bank",
  hdfc: "HDFC Bank",
  kotak: "Kotak Mahindra Bank"
};

/* ---------------------------------
   STATE
---------------------------------- */
let CURRENT_DATA = [];
let CURRENT_SLABS = [];

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
   Populate Filters
---------------------------------- */
function populateFilters() {
  tenureFilter.innerHTML = `<option value="">All</option>`;
  amountFilter.innerHTML = `<option value="">All</option>`;

  CURRENT_DATA.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.tenure;
    opt.textContent = t.tenure;
    tenureFilter.appendChild(opt);
  });

  CURRENT_SLABS.forEach(slab => {
    const opt = document.createElement("option");
    opt.value = slab;
    opt.textContent = slab;
    amountFilter.appendChild(opt);
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

  titleEl.textContent = `${BANK_NAMES[bank]} – ${config.label}`;

  const res = await fetch(config.file);
  const data = await res.json();

  CURRENT_DATA = data.tenures || data.rates || [];

  // Collect slabs
  const slabSet = new Set();
  CURRENT_DATA.forEach(t => {
    Object.keys(t.slabs || {}).forEach(s => slabSet.add(s));
  });
  CURRENT_SLABS = Array.from(slabSet);

  populateFilters();
  renderTable();
}

/* ---------------------------------
   Render Table (with filters)
---------------------------------- */
function renderTable() {
  const selectedTenure = tenureFilter.value;
  const selectedAmount = amountFilter.value;

  // ----- HEADER -----
  thead.innerHTML = "";
  const hr = document.createElement("tr");
  hr.innerHTML = "<th>Tenure</th>";

  CURRENT_SLABS.forEach(slab => {
    if (!selectedAmount || slab === selectedAmount) {
      hr.innerHTML += `<th>${slab} (General)</th>`;
      hr.innerHTML += `<th>${slab} (Senior)</th>`;
    }
  });
  thead.appendChild(hr);

  // ----- BODY -----
  tbody.innerHTML = "";

  CURRENT_DATA
    .filter(row => !selectedTenure || row.tenure === selectedTenure)
    .forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${row.tenure}</td>`;

      CURRENT_SLABS.forEach(slab => {
        if (selectedAmount && slab !== selectedAmount) return;

        const d = row.slabs?.[slab] || {};
        tr.innerHTML += `<td>${d.general ?? "-"}</td>`;
        tr.innerHTML += `<td>${d.senior ?? "-"}</td>`;
      });

      tbody.appendChild(tr);
    });
}
/* ---------------------------------
   DOWNLOAD EXCEL (VISIBLE TABLE ONLY)
---------------------------------- */
document.getElementById("download-excel").addEventListener("click", () => {
  const table = document.getElementById("fd-table");

  if (!table || table.rows.length === 0) {
    alert("No data to export");
    return;
  }

  // Convert visible table to worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(table);

  XLSX.utils.book_append_sheet(wb, ws, "FD Rates");

  const bank = bankSelect.value.toUpperCase();
  const product = productSelect.value.toUpperCase();

  const filename = `${bank}_${product}_FD_RATES.xlsx`;

  XLSX.writeFile(wb, filename);
});

/* ---------------------------------
   Events
---------------------------------- */
bankSelect.addEventListener("change", () => {
  updateProductOptions();
  loadFD();
});

productSelect.addEventListener("change", loadFD);
tenureFilter.addEventListener("change", renderTable);
amountFilter.addEventListener("change", renderTable);

/* ---------------------------------
   Initial Load
---------------------------------- */
updateProductOptions();
loadFD();

