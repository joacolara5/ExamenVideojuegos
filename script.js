const csvUrl = 'https://raw.githubusercontent.com/rudyluis/DashboardJS/refs/heads/main/video_games_sales.csv';
let rawData = [];
let charts = {};

document.addEventListener('DOMContentLoaded', async () => {
  rawData = await cargarDatosCSV(csvUrl);
  poblarFiltros(rawData);
  actualizarGraficos();
  document.querySelectorAll('select').forEach(select => {
    select.addEventListener('change', () => {
      actualizarGraficos();
      actualizarResumen();
    });
  });
});

async function cargarDatosCSV(url) {
  const response = await fetch(url);
  const text = await response.text();
  const rows = text.trim().split('\n').slice(1);
  return rows.map(row => {
    const [Rank, Name, Platform, Year, Genre, Publisher, NA_Sales, EU_Sales, JP_Sales, Other_Sales, Global_Sales] = row.split(/,(?=(?:[^"]*"[^\"]*")*[^"]*$)/);
    return {
      Rank: +Rank,
      Name,
      Platform,
      Year: Year === "N/A" ? null : +Year,
      Genre,
      Publisher,
      NA_Sales: +NA_Sales,
      EU_Sales: +EU_Sales,
      JP_Sales: +JP_Sales,
      Other_Sales: +Other_Sales,
      Global_Sales: +Global_Sales
    };
  });
}

function poblarFiltros(data) {
  const plataformas = [...new Set(data.map(d => d.Platform))].sort();
  const generos = [...new Set(data.map(d => d.Genre))].sort();
  const anios = [...new Set(data.map(d => d.Year).filter(Boolean))].sort((a, b) => a - b);

  llenarSelect('platformFilter', plataformas);
  llenarSelect('genreFilter', generos);
  llenarSelect('yearFilter', anios);
}

function llenarSelect(id, valores) {
  const select = document.getElementById(id);
  select.innerHTML = '<option value="">Todos</option>';
  valores.forEach(valor => {
    const option = document.createElement('option');
    option.value = valor;
    option.textContent = valor;
    select.appendChild(option);
  });
}

function filtrarDatos() {
  const plataforma = document.getElementById('platformFilter').value;
  const genero = document.getElementById('genreFilter').value;
  const anio = document.getElementById('yearFilter').value;

  return rawData.filter(d =>
    (!plataforma || d.Platform === plataforma) &&
    (!genero || d.Genre === genero) &&
    (!anio || d.Year == anio)
  );
}

function actualizarGraficos() {
  const dataFiltrada = filtrarDatos();

  const ventasPorRegion = {
    labels: ['NA', 'EU', 'JP', 'Other'],
    datasets: [{
      label: 'Ventas por Región (millones)',
      data: [
        suma(dataFiltrada, 'NA_Sales'),
        suma(dataFiltrada, 'EU_Sales'),
        suma(dataFiltrada, 'JP_Sales'),
        suma(dataFiltrada, 'Other_Sales')
      ],
      backgroundColor: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2']
    }]
  };

  const ventasPorAnio = {};
  dataFiltrada.forEach(d => {
    if (d.Year) {
      ventasPorAnio[d.Year] = (ventasPorAnio[d.Year] || 0) + d.Global_Sales;
    }
  });

  const radarData = {};
  dataFiltrada.forEach(d => {
    radarData[d.Genre] = (radarData[d.Genre] || 0) + d.Global_Sales;
  });

  const topGeneros = Object.entries(radarData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const doughnutData = {};
  dataFiltrada.forEach(d => {
    doughnutData[d.Platform] = (doughnutData[d.Platform] || 0) + d.Global_Sales;
  });

  const topPlataformas = Object.entries(doughnutData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const publisherData = {};
  dataFiltrada.forEach(d => {
    publisherData[d.Publisher] = (publisherData[d.Publisher] || 0) + d.Global_Sales;
  });

  const topPublishers = Object.entries(publisherData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const rankingData = dataFiltrada.slice(0, 10).map(d => ({
    label: d.Name,
    value: d.Global_Sales
  }));

  renderChart('chartRegion', 'bar', ventasPorRegion);
  renderChart('chartTrend', 'line', {
    labels: Object.keys(ventasPorAnio),
    datasets: [{
      label: 'Ventas Globales por Año (millones)',
      data: Object.values(ventasPorAnio),
      borderColor: '#4e79a7',
      backgroundColor: 'rgba(78,121,167,0.3)',
      fill: true
    }]
  });
  renderChart('chartRadar', 'radar', {
    labels: topGeneros.map(g => g[0]),
    datasets: [{
      label: 'Ventas por Género',
      data: topGeneros.map(g => g[1]),
      backgroundColor: 'rgba(78,121,167,0.3)',
      borderColor: '#4e79a7'
    }]
  });
  renderChart('chartDoughnut', 'doughnut', {
    labels: topPlataformas.map(p => p[0]),
    datasets: [{
      data: topPlataformas.map(p => p[1]),
      backgroundColor: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f']
    }]
  });
  renderChart('chartPublisher', 'doughnut', {
    labels: topPublishers.map(p => p[0]),
    datasets: [{
      data: topPublishers.map(p => p[1]),
      backgroundColor: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f']
    }]
  });
  renderChart('chartRanking', 'bar', {
    labels: rankingData.map(d => d.label),
    datasets: [{
      label: 'Ranking de Ventas',
      data: rankingData.map(d => d.value),
      backgroundColor: '#4e79a7'
    }]
  });
}

function renderChart(id, tipo, data) {
  if (charts[id]) {
    charts[id].destroy();
  }
  charts[id] = new Chart(document.getElementById(id), {
    type: tipo,
    data
  });
}

function suma(data, campo) {
  return data.reduce((acc, d) => acc + d[campo], 0);
}

function actualizarResumen() {
  const dataFiltrada = filtrarDatos();
  

  const ventasPorRegion = {
    NA: suma(dataFiltrada, 'NA_Sales'),
    EU: suma(dataFiltrada, 'EU_Sales'),
    JP: suma(dataFiltrada, 'JP_Sales'),
    Other: suma(dataFiltrada, 'Other_Sales')
  };
  
  
  const ventasGlobales = suma(dataFiltrada, 'Global_Sales');

  
  document.getElementById('totalGames').textContent = dataFiltrada.length;
  document.getElementById('totalSales').textContent = ventasGlobales.toFixed(2);
  document.getElementById('naSales').textContent = ventasPorRegion.NA.toFixed(2);
  document.getElementById('euSales').textContent = ventasPorRegion.EU.toFixed(2);
  document.getElementById('jpSales').textContent = ventasPorRegion.JP.toFixed(2);
  document.getElementById('otherSales').textContent = ventasPorRegion.Other.toFixed(2);
}


