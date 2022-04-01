
//Configurables
const width = 1000;
const height = 1000;
const geoDataPath = '/data/nasageo.json'; //link to geojson
const saDataPath = '/data/covid_south_america_weekly_trend.csv';
const naDataPath = '/data/covid_south_america_weekly_trend.csv';
const proj_scale = 245; //scale of projection
const def_trans = [900, 710] //default translation
const zoom_range = [1, 42] //

//ENUMS
const NORTH_AMERICA = 0;
const SOUTH_AMERICA = 1;
const ALL = 2;
const modes = {
    0: "North America",
    1: "South America"
}

let geoData
let na_data
let sa_data

const svg = d3.select('#Task').append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('id', 'tasksvg');

const g = svg.append('g').attr('id', 'g')



const proj = d3.geoMercator()
                .scale(proj_scale)
                .translate(def_trans)
const path = d3.geoPath(proj);

/*drawViz(geo, stats, cont_mode)
Draws our visualization
    geo: geojson data
    stats: array of csv data
    cont_mode: integer representation of continents to display, see enums
*/
let drawViz = (geo, stats, cont_mode) => {
    const chorog = g.append('g')
        .attr('id', 'chorog')

    chorog.selectAll('path')
        .data(geo.features)
        .enter()
        .append('path')
        .filter(function(d) { //Filtering continents
            if (cont_mode != ALL) {return d.properties.continent == modes[cont_mode]}
            return d;
        })
        .attr('name', d => d.properties.name)
        .attr('onclick', 'selectCountry(this)')
        .attr('class', 'country')
        .attr('d', path)
}

//Load and parse data
d3.json(geoDataPath).then((data, error) => {
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
    drawViz(geoData, {na_data, sa_data}, 2)
})

/* processclick(element)
Handles when radiobuttons are clicked
    element: DOM element that has been clicked
*/
function processClick(element){
    //to do: zoom when mode is changed
    d3.select('#chorog').remove()
    drawViz(geoData, {na_data, sa_data}, element.value)
}

/* selectCountry(element)
Handles when a country is selected (clicked)
    element: DOM element that has been clicked

*/
function selectCountry(element){
    console.log(element.getAttribute('name'))

    //todo: zoom on country select
    //https://observablehq.com/@d3/zoom-to-bounding-box

}

//zoom/pan handling
var zoom = d3.zoom()
    .scaleExtent(zoom_range)
    .translateExtent([[0, 0], [width, height]])
    .on('zoom', function(e) {
        g.select('g').attr('transform', e.transform);
});
svg.call(zoom);
