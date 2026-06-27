
const toggleBtn = document.getElementById("toggle-sidebar");

toggleBtn?.addEventListener("click", () => {
  const isHidden = document.body.classList.toggle("hide-sidebar");
  toggleBtn.setAttribute("aria-expanded", String(!isHidden));
});
