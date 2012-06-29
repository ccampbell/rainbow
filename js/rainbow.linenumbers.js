
/**
 * Adds lines and numbers to the pre element.
 * Set the pre color in CSS for the number color.
 * Set the pre border-color in CSS for the line color.
 * Set the starting line number by adding data-line="234" attribute to code element.
 * @author Ron Valstar (http://www.sjeiti.com/)
 * @namespace Rainbow.linenumbers
 * @requires Rainbow.js
 */
if (window.Rainbow&&!window.Rainbow.linenumbers) window.Rainbow.linenumbers = (function(Rainbow){
	var drawNumbers = true;
	var drawLines = true;
	Rainbow.onHighlight(function(block) {
		var toInt = parseInt
			,iLines = block.innerHTML.replace(/\r\n|\r/g,"\n").split("\n").length
			,iLineStart = block.getAttribute('data-line')<<0
			,iChars = iLines===0?1:(Math.log(iLines+iLineStart)/2.303<<0)+1 // 2.302585092994046 safely rounded to 2.303
			,i = iLines
			// <pre>
			,mParent = block.parentNode
			,bPre = mParent.nodeName=='PRE'
			// get <code>- and <pre> styles
			,getStyle = function(el){return el.currentStyle||(document.defaultView&&document.defaultView.getComputedStyle(el,null))||el.style}
			,oCodeStyle = getStyle(block)
			,oParentStyle = getStyle(mParent)
			,iLineHeight = toInt(oCodeStyle.lineHeight)
			,iTop = toInt(oParentStyle.paddingTop)+toInt(oCodeStyle.marginTop)+toInt(oCodeStyle.paddingTop)
			// numbers canvas
			,mCnvNumbers = document.createElement('canvas')
			,oCtxNumbers = mCnvNumbers.getContext('2d')
			// lines canvas
			,mCnvLines = document.createElement('canvas')
			,oCtxLines = mCnvLines.getContext('2d')
			// calculate character width
			,iCharWidth
			,iTestExp = 5
			,mTestDiv = document.createElement('div')
			,oTestStyle = mTestDiv.style
			,oTestCSS = {font:oCodeStyle.font,width:'auto',display:'inline-block'}
		;
		/*var N="\n";console.log(
			N,'iLineHeight',iLineHeight
			,N,'lineHeight',oCodeStyle.lineHeight
			,N,'fontSize',oCodeStyle.fontSize
			,N,'fontFamily',oCodeStyle.fontFamily
			,N,'font',oCodeStyle.font
			,N,'borderColor',oParentStyle.borderColor
			,N,'oCodeStyle',oCodeStyle.wordWrap
		);*/ // log
		// add test div, set it's CSS, and measure width
		mTestDiv.appendChild(document.createTextNode(new Array(1<<iTestExp).join('a')+'a'));
		for (var s in oTestCSS) oTestStyle[s] = oTestCSS[s];
		document.body.appendChild(mTestDiv);
		iCharWidth = mTestDiv.offsetWidth>>iTestExp;
		if (isNaN(iLineHeight)) iLineHeight = mTestDiv.offsetHeight; // for line-height: normal;
		document.body.removeChild(mTestDiv);
		// draw numbers canvas
		mCnvNumbers.setAttribute('width',iChars*iCharWidth);
		mCnvNumbers.setAttribute('height',(1+iLines)*iLineHeight);
		oCtxNumbers.font = oCodeStyle.fontSize+' '+oCodeStyle.fontFamily;
		oCtxNumbers.fillStyle = oParentStyle.color;
		oCtxNumbers.textBaseline = 'bottom';
		while (i--) {
			var iLnNr = iLines-i;
			oCtxNumbers.fillText((iLineStart+iLnNr-1)+'',0,iLnNr*iLineHeight);
		}
		// draw lines canvas
		mCnvLines.setAttribute('width',1);
		mCnvLines.setAttribute('height',iLineHeight);
		oCtxLines.fillStyle = oParentStyle.borderColor;
		oCtxLines.fillRect(0,iLineHeight-1,1,1);
		// adjust existing styles
		block.style.wordWrap = 'normal';
		mParent.style.overflowX = 'auto';
		// add images to <pre> background
		if (bPre) {
			// starting with the original background... then prepend lines and numbers
			var sBackground = oParentStyle.backgroundColor;
			if (drawLines) sBackground = 'url('+mCnvLines.toDataURL()+') 0 '+iTop+'px,'+sBackground;
			if (drawNumbers) {
				sBackground = 'url('+mCnvNumbers.toDataURL()+') '+iCharWidth+'px '+iTop+'px no-repeat,'+sBackground;
				// indenting the <pre> (indenting <code> messes up tabbing)
				mParent.style.paddingLeft = (parseInt(oParentStyle.paddingLeft)+iCharWidth*(iChars+1))+'px'
			}
			// adding background style to <pre> (again: adding it to <code> creates a mess)
			mParent.style.background = sBackground;
		}
	});
	// return something so as not to run again if accidentally included twice
	return {toString:function(){return '[Object Rainbow.linenumbers]'}}
})(window.Rainbow);
