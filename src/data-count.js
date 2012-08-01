dc.dataCount = function(selector) {
    var formatNumber = d3.format(",d");
    var formatPct = d3.format("2.1f");
    var chart = dc.baseChart({});

    chart.render = function() {
	var total = chart.dimension().size();
	var filt = chart.group().value();
        chart.selectAll(".total-count").text(formatNumber(total));
        chart.selectAll(".filter-count").text(formatNumber(filt));
        chart.selectAll(".filter-pct").text(( total == 0 ) ? "-" : (formatPct(filt/total*100.0) + "%"));

        return chart;
    };

    chart.redraw = function(){
        return chart.render();
    };

    return chart.anchor(selector);
};
