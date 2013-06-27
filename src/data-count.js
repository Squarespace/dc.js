dc.dataCount = function(selector) {
    var chart = dc.baseChart({});
    //
    // do this upon instantiation to store the unfiltered crossfilter rollup value.
    // I wish there were a better way.
    var total = null;

    var _superGroupAll = chart.groupAll;
    chart.groupAll = function() {
      var rv = _superGroupAll.apply(undefined, arguments);
      if ( arguments.length > 0 )
        total = _superGroupAll().value();
      return rv;
    };

    chart.render = function() {
        var filt = chart.group().value();
        chart.selectAll(".total-count").text(chart.valuePrinter()(total));
        chart.selectAll(".filter-count").text(chart.valuePrinter()(filt));
        chart.selectAll(".filter-pct").text(( total == null || total == 0 ) ? "-" : (dc.percentFormat(filt/total)));

        return chart;
    };

    chart.redraw = function(){
        return chart.render();
    };

    return chart.anchor(selector);
};
