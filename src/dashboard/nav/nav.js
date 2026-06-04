
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
    stats.style.gridTemplateColumns = "1fr";

    const availableMainHeight = main.clientHeight || window.innerHeight;
    
    Array.from(stats.children || []).forEach(w => {
      const neededPx    = Math.max(w.scrollHeight || 0, w.offsetHeight || 0);
      const maxH        = Math.floor(availableMainHeight * 0.7);
      const finalH      = Math.min(neededPx, maxH);
      
      w.style.width     = "100%";
      w.style.boxSizing = "border-box";
      w.style.height    = finalH + "px";
      w.style.overflowY = "auto";
    });

  } else {
    stats.style.gridTemplateColumns = "1fr 1fr";
    
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