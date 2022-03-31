
//Configurables
const width = 1000;
const height = 1000;
const geodatapath = '/data/nasageo.json'; //link to geojson
const proj_scale = 140; //scale of projection

const svg = d3.select('#Task').append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('id', 'tasksvg')
const chorog = svg.append('g').attr('id', 'chorog');
const proj = d3.geoMercator().scale(proj_scale);
const path = d3.geoPath(proj);

d3.json(geodatapath)
    .then(data => {
       chorog.selectAll('path')
            .data(data.features)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', path)
    })

chorog.attr('transform', 'translate(0, 200)')