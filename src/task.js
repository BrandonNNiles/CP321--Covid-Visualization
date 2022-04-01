
//Configurables
const width = 1000;
const height = 1000;
const geoDataPath = '/data/nasageo.json'; //link to geojson
const saDataPath = '/data/covid_south_america_weekly_trend.csv'
const naDataPath = '/data/covid_south_america_weekly_trend.csv'
const proj_scale = 140; //scale of projection

const svg = d3.select('#Task').append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('id', 'tasksvg')

const chorog = svg.append('g').attr('id', 'chorog');
const proj = d3.geoMercator().scale(proj_scale);
const path = d3.geoPath(proj);

let drawViz = (geo, stats) => {
    chorog.selectAll('path')
        .data(geo.features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path)

}

d3.json(geoDataPath).then((data, error) => {
    let geoData
    let na_data
    let sa_data
    if(error){console.log(error); return;} 
    geoData = data
    d3.csv(saDataPath).then(data, error => {
        if(error){console.log(error); return;}
        sa_data = data
        d3.csv(naDataPath).then(data, error => {
            if(error){console.log(error); return;}
            na_data = data
        })
    })
    drawViz(geoData, {na_data, sa_data})
})

chorog.attr('transform', 'translate(0, 200)')