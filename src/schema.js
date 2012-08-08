dc.schema = function() {

    var CARDINALITY_THRESHOLD_TO_PRESERVE_VALUES = 20;

    var DATE_FORMATS = [
	d3.time.format.iso,
	d3.time.format("%Y-%m-%d %H:%M:%S"),
	d3.time.format("%Y-%m-%d"),
	d3.time.format("%m-%d-%Y %H:%M:%S"),
	d3.time.format("%m-%d-%Y"),
	d3.time.format("%m-%d-%Y %H:%M:%S")
    ];

    var parsePossibleDate = function(v) {
        for ( var i = 0; i < DATE_FORMATS.length; i++ ) {
	    var val = DATE_FORMATS[i].parse(v);
	    if ( val != null ) { return val; }
	}
	return null;
    };


    var schema = {};

    schema.coerceData = function(data, metadata) {
        // find all properies whose type is 'date'.
	var dateprops = {};
	for ( var name in metadata.properties ) {
	    if ( metadata.properties[name].type == "date" ) {
	        dateprops[name] = true;
		var md = metadata.properties[name]; 
		if ( md.minimum != null ) { 
		    md.minimum = parsePossibleDate(md.minimum);
		}
		if ( md.maximum != null ) {
		    md.maximum = parsePossibleDate(md.maximum);
		}
		
	    }
	}
	if ( ! dateprops ) { return; }
	for ( var i=0; i < data.length; i++ ) {
	    var d = data[i];
	    for ( var k in d ) {
	        if (  dateprops[k] ) {
		    d[k] = parsePossibleDate(d[k]);
		}
	    }
	}
    };

    var newFieldMetadata = function() { return { "required": true, "cardinality": 0 }; };

    var determineDataType = function(v, currentType, coerce) {
	var thisType = "unknown";
	var v_typeof = typeof(v);
	var coercedValue = v;
	var wasCoerced = false;
        if ( v_typeof == "string" ) {
	    var pdate = parsePossibleDate(v);
	    if ( pdate != null ) {
		thisType = "date";
		if ( coerce ) {
		    coercedValue = pdate;
		    wasCoerced = true;
		}
	    }
	    else 
	        thisType = "string";
	}
	else if ( v_typeof == "number" ) 
	    thisType = "number";
	else if ( v_typeof == "integer" ) 
	    thisType = "integer";
	else if ( v_typeof == "boolean" ) 
	    thisType = "boolean";
	else if ( v.getMonth === "function" )
	    thisType = "date";
	
	if ( currentType != null && thisType != currentType ) {
	    if ( thisType == "number" && currentType == "integer" ) 
	        thisType = "number";
	    if ( thisType == "integer" && currentType == "number" ) 
	        thisType = "number";
	    if ( thisType == "date" && currentType == "string" ) 
	        thisType = "string";
	    else
	        thisType = "mixed";
	}
	return  { 'type' : thisType, 'coercedValue' : coercedValue, 'wasCoerced' : wasCoerced };
    };

    var objectSize = function(obj) {
        var size = 0;
	for ( var k in obj ) {
	    if ( obj.hasOwnProperty(k) ) size++;
	}
	return size;
    };

    schema.getMetadata = function(data, coerce) {
        var metadata = {};
	var props = {};
	metadata['properties'] = props;

	for ( var i = 0; i < data.length; i++ ) {
	    var item = data[i];
	    for ( var k in item ) {
	        var val = item[k];
		var fmd = props[k];
		if ( fmd == null ) {
		    fmd = newFieldMetadata();
		    props[k] = fmd;
		}
		if ( val == null ) {
		    fmd.required = false;
		}
		else {
		    var currentType = fmd.type;
		    var thisType = determineDataType(val, currentType, coerce);
		    if ( currentType == null ) 
		        fmd.type = thisType.type;
	            else if ( thisType.type != currentType ) 
		        fmd.type = "mixed";
		    if ( thisType.wasCoerced ) {
			val = thisType.coercedValue;
			item[k] = val;
		    }
		}

		var uniqs = fmd.values;
		if ( uniqs == null ) {
		    uniqs = {};
		    fmd.values = uniqs;
		}
		// val coerced to string for key, but kept intact for value.
		if ( uniqs[val] === undefined ) 
		    fmd.cardinality++;
		    uniqs[ val ] = val;
		// max and min.
		if ( fmd.minimum === undefined || val < fmd.minimum ) 
		    fmd.minimum = val;
		if ( fmd.maximum === undefined || val > fmd.maximum ) 
		    fmd.maximum = val;
	    }
	}

	for ( var fname in props ) {
	    var fmd = props[fname];
	    if ( fmd.cardinality >  CARDINALITY_THRESHOLD_TO_PRESERVE_VALUES ) {
		    delete fmd.values;
	    }
	}

	return metadata;
    };

    return schema;
}();
