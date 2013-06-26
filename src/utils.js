dc.dateFormat= d3.time.format("%m/%d/%Y");
dc.numberFormat = d3.format(",.0f");
dc.percentFormat = d3.format(",.1p");

dc.printers = {};

dc.printers.emptyValueLabel = "(none)";

dc.printers.value = function(filter) {
	if ( filter == null || filter == undefined || filter === "" )
		return dc.printers.emptyValueLabel;
	else if (filter instanceof Date)
        return dc.dateFormat(filter);
    else if(typeof(filter) == "string")
        return filter;
    else if(typeof(filter) == "number")
        return dc.numberFormat(filter);
    else
    	return "" + filter;
};

dc.printers.filter = function(filter) {
     var valuePrinter = dc.printers.value;
     if (filter instanceof Array) {
            if (filter.length >= 2)
                return "[" + valuePrinter(filter[0]) + " -> " + valuePrinter(filter[1]) + "]";
            else if (filter.length >= 1)
                return valuePrinter(filter[0]);
     }
     return valuePrinter(filter);
};

