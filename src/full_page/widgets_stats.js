new Chart(document.getElementById('chart'), {
  type: 'line',
  data: {
    labels: ['Mo','Di','Mi','Do','Fr','Sa','So'],
    datasets: [{
      label: 'Min/Tag',
      data: [30,45,20,60,50,80,400],
      borderColor: 'blue',
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false
  }
});

const container = document.getElementById("heatmap");

const days = 365;
const startDate = new Date();

for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() - i);

    const val = Math.floor(Math.random() * 5);

    const cell = document.createElement("div");
    cell.className = "cell";

    if (val === 1) cell.classList.add("l1");
    else if (val === 2) cell.classList.add("l2");
    else if (val === 3) cell.classList.add("l3");
    else if (val === 4) cell.classList.add("l4");

    container.appendChild(cell);
}