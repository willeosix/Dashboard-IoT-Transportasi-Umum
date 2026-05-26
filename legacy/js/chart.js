/**
 * chart.js (ChartModule)
 * Modul Chart.js untuk live line chart kepadatan penumpang.
 * Menampilkan 3 dataset: Total Menunggu, Masuk, Keluar.
 */

const ChartModule = (() => {
  let _chart = null;
  const MAX_DATA_POINTS = 25;

  // Warna dataset — sesuai design system
  const DATASET_COLORS = {
    menunggu: { border: '#40916c', bg: 'rgba(64, 145, 108, 0.15)' },
    masuk:    { border: '#e9c46a', bg: 'rgba(233, 196, 106, 0.1)' },
    keluar:   { border: '#e76f51', bg: 'rgba(231, 111, 81, 0.1)' },
  };

  function init(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error('[Chart] Canvas element tidak ditemukan:', canvasId);
      return;
    }

    const ctx = canvas.getContext('2d');

    // Set Chart.js dark theme defaults
    Chart.defaults.color = '#a0a8b8';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.06)';

    _chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Total Menunggu',
            data: [],
            borderColor: DATASET_COLORS.menunggu.border,
            backgroundColor: DATASET_COLORS.menunggu.bg,
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: DATASET_COLORS.menunggu.border,
            pointBorderColor: '#1a1f2e',
            pointBorderWidth: 1.5,
            pointHoverRadius: 6,
          },
          {
            label: 'Akum. Masuk',
            data: [],
            borderColor: DATASET_COLORS.masuk.border,
            backgroundColor: DATASET_COLORS.masuk.bg,
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            pointRadius: 2,
            pointBackgroundColor: DATASET_COLORS.masuk.border,
            pointBorderColor: '#1a1f2e',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            borderDash: [5, 3],
          },
          {
            label: 'Akum. Keluar',
            data: [],
            borderColor: DATASET_COLORS.keluar.border,
            backgroundColor: DATASET_COLORS.keluar.bg,
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            pointRadius: 2,
            pointBackgroundColor: DATASET_COLORS.keluar.border,
            pointBorderColor: '#1a1f2e',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            borderDash: [5, 3],
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 400,
          easing: 'easeOutQuart'
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: '#a0a8b8',
              font: { family: "'DM Sans', sans-serif", size: 11 },
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 8,
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 20, 25, 0.95)',
            titleColor: '#e8e0d4',
            bodyColor: '#a0a8b8',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            titleFont: { family: "'DM Sans', sans-serif", size: 12, weight: '600' },
            bodyFont: { family: "'DM Sans', sans-serif", size: 11 },
            cornerRadius: 8,
            displayColors: true,
            usePointStyle: true,
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#6b7280',
              font: { family: "'DM Sans', sans-serif", size: 10 },
              maxRotation: 0,
              maxTicksLimit: 8,
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.04)',
              drawBorder: false,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#6b7280',
              font: { family: "'DM Sans', sans-serif", size: 10 },
              stepSize: 5,
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.04)',
              drawBorder: false,
            },
          }
        }
      }
    });
  }

  /**
   * Tambahkan data point baru ke chart
   */
  function addDataPoint(timestamp, totalMenunggu, totalMasuk, totalKeluar) {
    if (!_chart) return;

    const timeLabel = new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    _chart.data.labels.push(timeLabel);
    _chart.data.datasets[0].data.push(totalMenunggu);
    _chart.data.datasets[1].data.push(totalMasuk);
    _chart.data.datasets[2].data.push(totalKeluar);

    // Sliding window
    if (_chart.data.labels.length > MAX_DATA_POINTS) {
      _chart.data.labels.shift();
      _chart.data.datasets.forEach(ds => ds.data.shift());
    }

    _chart.update('none');
  }

  function clear() {
    if (!_chart) return;
    _chart.data.labels = [];
    _chart.data.datasets.forEach(ds => { ds.data = []; });
    _chart.update('none');
  }

  function destroy() {
    if (_chart) {
      _chart.destroy();
      _chart = null;
    }
  }

  return { init, addDataPoint, clear, destroy };
})();
