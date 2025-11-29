// ===== BASIC STATE =====

let wallets = []; // replace with your real loader if you have one

// Example placeholder holdings so UI isn't empty.
// Replace with your real balances/prices fetch.
wallets = [
  {
    id: "primary",
    label: "Primary Wallet",
    address: "0x1234...abcd",
    totalUsd: 12340.23,
    change24hPct: 2.3,
    holdings: [
      {
        symbol: "ETH",
        name: "Ethereum",
        logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=032",
        amount: 0.1234,
        usdValue: 451.02,
        change24hPct: 3.1,
        tokenAddress: null
      },
      {
        symbol: "PYUSD",
        name: "PayPal USD (Sepolia)",
        logoUrl: "https://cryptologos.cc/logos/paypal-usd-pyusd-logo.png?v=032",
        amount: 10,
        usdValue: 10,
        change24hPct: 0.0,
        tokenAddress: "0x..."
      }
    ]
  }
];

// Currently selected wallet
let currentWalletId = wallets[0]?.id || null;

// ===== HELPERS =====

const walletsContainer = document.getElementById("walletsContainer");
const walletAddressEl = document.getElementById("walletAddress");
const fiatBalanceLabelEl = document.getElementById("fiatBalanceLabel");

function formatPct(p) {
  if (p === null || p === undefined) return "--";
  const sign = p > 0 ? "+" : "";
  return `${sign}${p.toFixed(2)}%`;
}

function formatUsd(x) {
  if (x === null || x === undefined || Number.isNaN(x)) return "$0.00";
  return `$${x.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function getWalletById(id) {
  return wallets.find((w) => w.id === id);
}

function refreshHeader() {
  const wallet = getWalletById(currentWalletId);
  if (!wallet) {
    walletAddressEl.textContent = "No wallet selected";
    fiatBalanceLabelEl.textContent = "$0.00";
    return;
  }
  walletAddressEl.textContent = wallet.address;
  fiatBalanceLabelEl.textContent = formatUsd(wallet.totalUsd);
}

// ===== RENDER WALLETS & HOLDINGS =====

function renderWallets() {
  walletsContainer.innerHTML = "";

  wallets.forEach((wallet) => {
    const card = document.createElement("article");
    card.className = "wallet-card";
    card.dataset.walletId = wallet.id;

    const changeClass =
      wallet.change24hPct > 0
        ? "positive"
        : wallet.change24hPct < 0
        ? "negative"
        : "";

    card.innerHTML = `
      <button class="wallet-header" type="button">
        <div class="wallet-header-main">
          <div class="wallet-name">${wallet.label}</div>
          <div class="wallet-address">${wallet.address}</div>
        </div>
        <div class="wallet-header-meta">
          <span class="wallet-balance">${formatUsd(wallet.totalUsd)}</span>
          <span class="wallet-change ${changeClass}">
            ${formatPct(wallet.change24hPct)} (24h)
          </span>
          <span class="wallet-toggle">+</span>
        </div>
      </button>
      <div class="wallet-holdings" hidden>
        <div class="holding-row holding-row-header">
          <span>Asset</span>
          <span></span>
          <span>Amount</span>
          <span>Value (USD)</span>
          <span>24h Change</span>
          <span>Action</span>
        </div>
      </div>
    `;

    const holdingsContainer = card.querySelector(".wallet-holdings");

    wallet.holdings.forEach((h, index) => {
      const holdingRow = document.createElement("div");
      const hChangeClass =
        h.change24hPct > 0 ? "positive" : h.change24hPct < 0 ? "negative" : "";

      holdingRow.className = "holding-row";
      holdingRow.dataset.walletId = wallet.id;
      holdingRow.dataset.holdingIndex = index;

      holdingRow.innerHTML = `
        <div class="holding-asset-logo">
          <img src="${h.logoUrl}" alt="${h.symbol}" />
        </div>
        <div class="holding-asset-name">
          <div class="holding-symbol">${h.symbol}</div>
          <div class="holding-name">${h.name}</div>
        </div>
        <div class="holding-amount">${h.amount}</div>
        <div class="holding-value">${formatUsd(h.usdValue)}</div>
        <div class="holding-change ${hChangeClass}">
          ${formatPct(h.change24hPct)}
        </div>
        <div class="holding-action">
          <button class="action-btn" type="button" data-open-menu>
            Action ▾
          </button>
          <div class="action-menu" hidden>
            <button class="action-item" data-action="safesend">
              <span class="safesend-tv">SafeSend</span>
            </button>
            <button class="action-item" data-action="swap">Swap</button>
            <button class="action-item" data-action="buy">Buy More</button>
            <button class="action-item" data-action="liquidate">Liquidate</button>
          </div>
        </div>
      `;

      holdingsContainer.appendChild(holdingRow);
    });

    walletsContainer.appendChild(card);
  });

  refreshHeader();
}

// Expand / collapse wallet
walletsContainer.addEventListener("click", (e) => {
  const header = e.target.closest(".wallet-header");
  if (!header) return;

  const card = header.closest(".wallet-card");
  const holdings = card.querySelector(".wallet-holdings");
  const toggleIcon = card.querySelector(".wallet-toggle");

  const isHidden = holdings.hasAttribute("hidden");
  if (isHidden) {
    holdings.removeAttribute("hidden");
    toggleIcon.textContent = "–";
  } else {
    holdings.setAttribute("hidden", "");
    toggleIcon.textContent = "+";
  }

  const id = card.dataset.walletId;
  currentWalletId = id;
  refreshHeader();
});

// Global click handler for action menus
document.addEventListener("click", (e) => {
  // Close all menus when clicking outside
  if (!e.target.closest(".holding-action")) {
    document
      .querySelectorAll(".action-menu:not([hidden])")
      .forEach((menu) => menu.setAttribute("hidden", ""));
    return;
  }

  const actionContainer = e.target.closest(".holding-action");
  if (!actionContainer) return;

  const button = e.target.closest("[data-open-menu]");
  const menu = actionContainer.querySelector(".action-menu");

  if (button) {
    const isHidden = menu.hasAttribute("hidden");
    document
      .querySelectorAll(".action-menu:not([hidden])")
      .forEach((m) => m.setAttribute("hidden", ""));
    if (isHidden) menu.removeAttribute("hidden");
    else menu.setAttribute("hidden", "");
    return;
  }

  const item = e.target.closest(".action-item");
  if (!item) return;

  const action = item.dataset.action;
  const holdingRow = actionContainer.closest(".holding-row");
  const walletId = holdingRow.dataset.walletId;
  const holdingIndex = Number(holdingRow.dataset.holdingIndex);
  const wallet = getWalletById(walletId);
  const holding = wallet?.holdings[holdingIndex];

  menu.setAttribute("hidden", "");

  if (!wallet || !holding) return;

  if (action === "safesend") {
    startSafeSendForHolding(wallet, holding);
  } else {
    console.log(`TODO: implement ${action} for`, wallet.label, holding.symbol);
  }
});

// ===== SAFE SEND HOOK =====
// Route SafeSend action into your existing send flow.
function startSafeSendForHolding(wallet, holding) {
  console.log("SafeSend for:", wallet.label, holding.symbol);

  // Example: prefill recipient & asset in your existing flow.
  // You likely already have some function like openSendModal / openSafeSend.
  // Replace the following stub with that call:

  // openSendModal({
  //   fromWalletId: wallet.id,
  //   assetSymbol: holding.symbol,
  //   tokenAddress: holding.tokenAddress
  // });

  // For now, we just ensure the send button is visible and maybe scroll to it.
  const sendBtn = document.getElementById("sendBtn");
  if (sendBtn) {
    sendBtn.focus();
  }
}

// ===== HERO / NETWORK STUBS =====

const networkSelect = document.getElementById("networkSelect");
networkSelect.addEventListener("change", (e) => {
  const network = e.target.value;
  console.log("Switch network to", network);
  // plug this into your existing RPC/Alchemy switch logic
});

// ===== CREATE WALLET & IMPORT WALLET =====

const createWalletBtn = document.getElementById("createWalletBtn");
const importWalletBtn = document.getElementById("importWalletBtn");

const createWalletModal = document.getElementById("createWalletModal");
const importWalletModal = document.getElementById("importWalletModal");

const cwMnemonicEl = document.getElementById("cwMnemonic");
const cwAddressEl = document.getElementById("cwAddress");
const cwLabelEl = document.getElementById("cwLabel");
const cwConfirmBtn = document.getElementById("cwConfirmBtn");

const iwLabelEl = document.getElementById("iwLabel");
const iwMnemonicEl = document.getElementById("iwMnemonic");
const iwErrorEl = document.getElementById("iwError");
const iwImportBtn = document.getElementById("iwImportBtn");

function openModal(modalEl) {
  modalEl.removeAttribute("hidden");
}

function closeModal(modalEl) {
  modalEl.setAttribute("hidden", "");
}

// Close modals on backdrop / X / Cancel
document.addEventListener("click", (e) => {
  if (e.target.matches("[data-close-modal]")) {
    const modal = e.target.closest(".modal") || e.target.dataset.targetModal;
    if (modal instanceof HTMLElement) {
      closeModal(modal);
    } else {
      // close all
      document
        .querySelectorAll(".modal")
        .forEach((m) => m.setAttribute("hidden", ""));
    }
  }
});

// CREATE WALLET FLOW
createWalletBtn.addEventListener("click", () => {
  try {
    const wallet = ethers.Wallet.createRandom();
    const phrase = wallet.mnemonic && wallet.mnemonic.phrase;

    cwLabelEl.value = "New wallet";
    cwMnemonicEl.value = phrase || "";
    cwAddressEl.textContent = wallet.address;

    // NOTE: we do NOT store the mnemonic anywhere automatically.
    openModal(createWalletModal);
  } catch (err) {
    console.error("Error creating wallet", err);
    alert("Unable to create wallet. Check console for details.");
  }
});

cwConfirmBtn.addEventListener("click", () => {
  const label = cwLabelEl.value.trim() || "New wallet";
  const phrase = cwMnemonicEl.value.trim();
  const address = cwAddressEl.textContent.trim();

  if (!phrase || !address) {
    alert("Seed phrase or address missing.");
    return;
  }

  // Add to wallet list. You should also hook this into your secure key storage.
  const id = `wallet_${Date.now()}`;
  wallets.push({
    id,
    label,
    address,
    totalUsd: 0,
    change24hPct: 0,
    holdings: []
  });
  currentWalletId = id;
  renderWallets();
  closeModal(createWalletModal);
});

// IMPORT WALLET FLOW
importWalletBtn.addEventListener("click", () => {
  iwLabelEl.value = "";
  iwMnemonicEl.value = "";
  iwErrorEl.textContent = "";
  iwErrorEl.setAttribute("hidden", "");
  openModal(importWalletModal);
});

iwImportBtn.addEventListener("click", () => {
  const label = iwLabelEl.value.trim() || "Imported wallet";
  const phrase = iwMnemonicEl.value.trim().toLowerCase();

  iwErrorEl.textContent = "";
  iwErrorEl.setAttribute("hidden", "");

  if (!phrase) {
    iwErrorEl.textContent = "Seed phrase is required.";
    iwErrorEl.removeAttribute("hidden");
    return;
  }

  const words = phrase.split(/\s+/);
  if (words.length !== 12 && words.length !== 24) {
    iwErrorEl.textContent = "Seed phrase must be 12 or 24 words.";
    iwErrorEl.removeAttribute("hidden");
    return;
  }

  try {
    if (!ethers.utils.isValidMnemonic(phrase)) {
      throw new Error("Invalid mnemonic");
    }

    const hdNode = ethers.utils.HDNode.fromMnemonic(phrase);
    const derivedWallet = new ethers.Wallet(hdNode.privateKey);
    const address = derivedWallet.address;

    const id = `wallet_${Date.now()}`;
    wallets.push({
      id,
      label,
      address,
      totalUsd: 0,
      change24hPct: 0,
      holdings: []
    });

    currentWalletId = id;
    renderWallets();
    closeModal(importWalletModal);
  } catch (err) {
    console.error("Import error", err);
    iwErrorEl.textContent =
      "That seed phrase could not be imported. Please double-check the words.";
    iwErrorEl.removeAttribute("hidden");
  }
});

// ===== INITIALIZE =====
renderWallets();