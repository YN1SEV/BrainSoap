
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

  if (availableMainWidth < statsBoarderWidth) {
    document.body.classList.add("stats-1x4");
    stats.style.gridTemplateColumns = "1fr";
    stats.style.gridAutoRows = "auto";

    Array.from(stats.children || []).forEach(w => {
      w.style.width     = "100%";
      w.style.boxSizing = "border-box";
      w.style.height    = "auto";
      w.style.overflowY = "visible";
    });

  } else {
    document.body.classList.remove("stats-1x4");
    stats.style.gridTemplateColumns = "1fr 1fr";
    stats.style.gridAutoRows = "";
    
    Array.from(stats.children || []).forEach(w => {
      w.style.width     = "";
      w.style.height    = "";
      w.style.boxSizing = "";
      w.style.overflowY = "";
    });
  }

}



// ------------------------------------------------------------------------------------------------------------------
// Event Listeners

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("hide-sidebar");
  updateLayout();
});

window.addEventListener("resize", updateLayout);
window.addEventListener("load", updateLayout);
requestAnimationFrame(updateLayout);
