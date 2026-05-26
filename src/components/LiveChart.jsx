'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MAX_DATA_POINTS = 25;

const DATASET_COLORS = {
  menunggu: { border: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' }, // Green
  masuk:    { border: '#facc15', bg: 'rgba(250, 204, 21, 0.1)' },  // Yellow
  keluar:   { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },   // Red
};

export default function LiveChart({ dataPoints }) {
  const chartRef = useRef(null);
  
  const data = {
    labels: dataPoints.map(p => p.timeLabel),
    datasets: [
      {
        label: 'Total Menunggu',
        data: dataPoints.map(p => p.menunggu),
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
        data: dataPoints.map(p => p.masuk),
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
        data: dataPoints.map(p => p.keluar),
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
  };

  const options = {
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
          color: '#94a3b8',
          font: { family: "'Inter', sans-serif", size: 11 },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 20, 25, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        titleFont: { family: "'Inter', sans-serif", size: 12, weight: '600' },
        bodyFont: { family: "'Inter', sans-serif", size: 11 },
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#64748b',
          font: { family: "'Inter', sans-serif", size: 10 },
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
          color: '#64748b',
          font: { family: "'Inter', sans-serif", size: 10 },
          stepSize: 5,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
          drawBorder: false,
        },
      }
    }
  };

  return <Line ref={chartRef} data={data} options={options} />;
}
