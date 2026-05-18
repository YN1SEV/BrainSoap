



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


