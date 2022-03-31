
//Configurables
const width = 1000;
const height = 1000;
const geodatapath = '/data/nasageo.json'; //link to geojson
const proj_scale = 140; //scale of projection

const svg = d3.select('#Task').append('svg')
    .attr('width', width)
    .attr('height', height)
const g = svg.append('g');
const proj = d3.geoMercator().scale(proj_scale);
const path = d3.geoPath(proj);

d3.json(geodatapath)
    .then(data => {
        g.selectAll('path')
            .data(data.features)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', path)
    })

g.attr('transform', 'translate(0, 200)')