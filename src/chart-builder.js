dc.newCrossfilter = function(data, strategy) {
    var crfilt = crossfilter(data);
    var obj = { 
        "crossfilter": crfilt,
        "dimensions": {}, 
        "groups": {}, 
        "info": {}
    };  

    function dim_group(dim, info) {
        if ( info.type === 'array' ) {
	    return dim.groupAll().reduce(
		function(p,v) { var val = info.value_accessor(v); for ( var i = 0; i < val.length; i++ ) { p[val[i]] = (p[val[i]] || 0) + 1; } return p; },
		function(p,v) { var val = info.value_accessor(v); for ( var i = 0; i < val.length; i++ ) { p[val[i]] = (p[val[i]] || 1) - 1; } return p; },
		function() { return {}; }
	    );
	}
	else {
	    return dim.group();
	}
    }

    for ( var propname in strategy ) { 
        var info = strategy[propname];
        var dim = crfilt.dimension(info.value_accessor);
        var grp = dim_group(dim, info);
        obj.dimensions[propname] = dim;
        obj.groups[propname] = grp;
        obj.info[propname] = info;
    }   

    return obj;
};  

dc.chartBuilder = function() {

    var chartBuilder = {
	"defaultMargins" : {top: 10, right: 50, bottom: 30, left: 40},
	"defaultHeight" : 100,
	"defaultWidth" : 900,
	"defaultTransition" : 300,
	"defaultPieSize" : 180,
	"defaultPieRadius": 80,
	"defaultPieInnerRadius": 20,
	"defaultTableWidth": 200,
	"defaultTableHeight": 300
    };

    chartBuilder.chartDivBuilder = function(div, chart_info) {
        var title = div.append("div").classed("title", true).text(chart_info.field_name);
	title.append("span").classed("filter", true).style("display", "none")
	if ( chart_info.hierarchical ) {
	    title.append("span").classed("filter-pop", true)
	        .attr("onclick", "dc.getChartFor(this).popFilter();dc.redrawAll();return true;")
		.style("display", "none").text("back");
	}
	title.append("span").classed("reset", true)
	    .attr("onclick", "dc.getChartFor(this).filterAll();dc.redrawAll();return true;")
	    .style("display", "none").text("reset");
    };

    chartBuilder.build = function(selection, crossfilter_obj) {

	var charts = {};

	// collapse hierarchies into one composite.
	// only case handled so far is channel + et al.
	var hier = {};
	var hier_type = null;
	var hier_name = 'attribution';
	for ( var propname in crossfilter_obj.info ) {
	    if ( ! (propname in dc.chartStrategy.ATTRIBUTION_PROPERTIES) ) 
		continue;
	    if ( hier_type && crossfilter_obj.info[propname].type != hier_type )
		continue;
	    hier_type = crossfilter_obj.info[propname].type;
	    hier[propname] = crossfilter_obj.info[propname];
	}

	if (  hier_type ) {
	    var hlist = [];
	    for ( propname in hier ) {
		delete crossfilter_obj.info[propname];
		hlist.push(hier[propname]);
	    }
	    hlist.sort(
		function(a,b) { 
		    var pa = dc.chartStrategy.ATTRIBUTION_PROPERTIES[a.field_name], pb = dc.chartStrategy.ATTRIBUTION_PROPERTIES[b.field_name]; 
		    return pa < pb ? -1 : ( pa > pb ? 1 : 0 ); 
		} 
	    );
	    crossfilter_obj.info[hier_name] = hlist;
	    var dims = [];
	    var grps = [];
	    for ( var i = 0; i < hlist.length; i++ ) {
		var info = hlist[i];
		dims.push(crossfilter_obj.dimensions[info.field_name]);
		grps.push(crossfilter_obj.groups[info.field_name]);
		delete crossfilter_obj.dimensions[info.field_name];
		delete crossfilter_obj.groups[info.field_name];
	    }
	    crossfilter_obj.dimensions[hier_name] = dims;
	    crossfilter_obj.groups[hier_name] = grps;
	    crossfilter_obj.info[hier_name] = hlist[0];
	    crossfilter_obj.info[hier_name].hierarchical = true;
	}

	var propnames = [];
	for ( var propname in crossfilter_obj.info ) {
	    propnames.push(propname);
	}
	propnames.sort(
	    function(a,b) { 
		var pa = crossfilter_obj.info[a].type; 
		var pb = crossfilter_obj.info[b].type; 
		return (pa < pb) ? -1 : ( pa > pb ? 1 : 0 ); 
	    }
	);

	// the base charts div.
	var charts_div = selection.select("#charts");
	if ( charts_div.empty() )
	    charts_div = selection.append("div").attr("id", "charts").classed("charts", true);

	// put the charts in child divs.
	for ( var i = 0; i < propnames.length; i++ ) {
	    var propname = propnames[i];
	    var info = crossfilter_obj.info[propname];
	    var selector = propname + "-chart";
	    if ( selection.select("#" + selector).empty() ) {
		var chart_div = charts_div.append("div").attr("id", selector)
		    .classed("chart", true).classed(info.type + "-chart", true);
		chartBuilder.chartDivBuilder(chart_div, info);
	    }
	    var chart = null;
	    if ( info.type == "bar" ) {
		chart = dc.barChart("#" + selector)
		.width(chartBuilder.defaultWidth)
		.height(chartBuilder.defaultHeight)
		.transitionDuration(chartBuilder.defaultTransition)
		.margins(chartBuilder.defaultMargins)
		.dimension(crossfilter_obj.dimensions[propname])
		.group(crossfilter_obj.groups[propname])
		.elasticY(true)
		.x(info.domain)
		.round(info.round);
		if ( info.domainUnits ) { chart.xUnits(info.domainUnits); }
	    }
	    else if ( info.type == "pie" ) {
		var dim = crossfilter_obj.dimensions[propname];
		var grp = crossfilter_obj.groups[propname];
		chart = dc.pieChart("#" + selector, Array.isArray(dim))
		.width(chartBuilder.defaultPieSize)
		.height(chartBuilder.defaultPieSize)
		.radius(chartBuilder.defaultPieRadius)
		.innerRadius(chartBuilder.defaultPieInnerRadius)
		.transitionDuration(chartBuilder.defaultTransition)
		.renderTitle(true);

		if ( Array.isArray(dim) ) {
		    for ( var j = 0; j < dim.length; j++ ) {
			chart.addDimensionAndGroup(dim[j], grp[j]);
		    }
		}
		else {
		    chart.dimension(dim).group(grp);
		}
	    }}
	    else if ( info.type == "table" ) {
		var dim = crossfilter_obj.dimensions[propname];
		var grp = crossfilter_obj.groups[propname];
		chart = dc.tableChart("#" + selector, Array.isArray(dim))
		.width(chartBuilder.defaultTableWidth)
		.height(chartBuilder.defaultTableHeight)
		.transitionDuration(chartBuilder.defaultTransition)
		.renderTitle(true);

		if ( Array.isArray(dim) ) {
		    for ( var j = 0; j < dim.length; j++ ) {
			chart.addDimensionAndGroup(dim[j], grp[j]);
		    }
		}
		else {
		    chart.dimension(dim).group(grp);
		}
	    }
	    charts[selector] = chart;
	}

	// a reset-all link
	selection.append("div")
	    .attr("id", "#reset-all").classed("reset", true)
	    .attr("onclick", "dc.filterAll();dc.redrawAll();return true")
	    .text("Reset all");

	// a data-count
	var dc_div = selection.append("div").attr("id", "data-count");
	dc_div.append("span").classed("filter-count", true).text("-");
	dc_div.append("span").text(" (");
	dc_div.append("span").classed("filter-pct", true).text("-");
	dc_div.append("span").text(") of ");
	dc_div.append("span").classed("total-count", true).text("-");
	dc_div.append("span").text(" items selected.");

	charts['data-count'] = dc.dataCount("#data-count")
	                         .dimension(crossfilter_obj.crossfilter)
				 .group(crossfilter_obj.crossfilter.groupAll());

	// TODO a data-table

	return charts;
    };

    return chartBuilder;
}();


