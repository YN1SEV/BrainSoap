
// ------------------------------------------------------------------------------------------------------------------
// Nav and responsive Main

const styles = getComputedStyle(document.documentElement);
const baseSidebarWidth = parseInt(styles.getPropertyValue("--sidebar-width"));
const mainMinWidth     = parseInt(styles.getPropertyValue("--main-min-width"));
const statsBoarderWidth= parseInt(styles.getPropertyValue("--stats-boarder-width"))

const sidebar   = document.querySelector(".sidebar");
const main      = document.querySelector("main");
const toggleBtn = document.getElementById("toggle-sidebar");
const stats     = document.getElementById("stats");

function updateLayout() {
  const isHidden = document.body.classList.contains("hide-sidebar");
  const sidebarWidth = isHidden ? 0 : baseSidebarWidth;
  const availableMainWidth = window.innerWidth - sidebarWidth;

  if (availableMainWidth < mainMinWidth) main.classList.add("hidden"); 
  else                                   main.classList.remove("hidden");

  if (availableMainWidth < statsBoarderWidth) stats.style.gridTemplateColumns = "1fr";
  else                          stats.style.gridTemplateColumns = "1fr 1fr";

}



// ------------------------------------------------------------------------------------------------------------------
// Event Listeners

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("hide-sidebar");
  updateLayout();
});

window.addEventListener("resize", updateLayout);
updateLayout();