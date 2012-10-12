
dc.tableChart = function(selector, hierarchical) {

    var chart = dc.singleSelectionChart(dc.colorChart(dc.baseChart({})), hierarchical);

    chart.label(function(d) {
        return chart.valuePrinter()(chart.keyRetriever()(d.data));
    });
    chart.renderLabel(true);

    chart.title(function(d) {
        return chart.valuePrinter()(d.data.key) + ": " + chart.valuePrinter()(d.data.value);
    });

    chart.transitionDuration(350);

    chart.render = function() {
      chart.selectAll("div.row").remove();

      if (chart.dataAreSet()) {

        dataPie = calculateDataPie();
        
        var rowEnter = chart.root()
          .selectAll("div.row")
          .data(dataPie(chart.group().top(Infinity)))
          .enter()
          .append("div")
          .attr("class", "row");


        var columns = [
            function(d) {
              return d.data.key;
            },
            function(d) {
              return d.data.value;
            }
          ];
        
        for (var i = 0; i < columns.length; ++i) {
              var f = columns[i];
              rowEnter.append("span")
                  .attr("class", "column column-" + i + (columns.length - i == 1 ? " last-column" : ""))
                  .text(function(d) {
                      return f(d);
                  })
                  .on('click', onClick);
        }
      }

      return chart;
    };

    chart.isSelectedSlice = function(d) {
        return chart.filter() == chart.keyRetriever()(d.data);
    };

    chart.redraw = function() {
      chart.render();

      if (chart.hasFilter()) {
          chart.selectAll("div.row").each(function(d) {
              if (chart.isSelectedSlice(d)) {
                  chart.highlightSelected(this);
              } else {
                  chart.fadeDeselected(this);
              }
          });
      } else {
          chart.selectAll("div.row").each(function(d) {
              chart.resetHighlight(this);
          });
      }
    };

    function calculateDataPie() {
        return d3.layout.pie().value(function(d) {
            return chart.valueRetriever()(d);
        });
    }

    function onClick(d) {
        chart.filter(chart.keyRetriever()(d.data));
        dc.redrawAll();
    }

    return chart.anchor(selector);
};