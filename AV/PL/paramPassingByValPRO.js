"use strict";
/*global alert: true, ODSA */
$(document).ready(function () {
  // Relative offsets
  var leftMargin = 25;
  var topMargin = 200;
  var currentTopMargin = 0;
  var currentFooTopMargin;
  var labelMargin = 10;
  var jsavArrayOffset = 6;
  var lineHeight = 40;
  var boxWidth = 150;
  var boxPadding = 5;
  var fooIndex, mainIndex;
  var classVars = {};
  var classLabels = {};
  var mainVars = {};
  var mainLabels = {};
  var mainVarNum = 0;
  var fooVarNames = [];
  var fooVars = {};
  var fooLabels = {};
  var currentLineMain = 0;
  var currentLineFoo = 0;
  var output = '';
  var jsavElements;
  function unhighlightAll(){
    unhighlightElements(classVars);
    unhighlightElements(mainVars);
    unhighlightElements(fooVars);
  }

  function clickHandler(jsavArr){
    return function(index){
      unhighlightAll();
      var valInput = $('#answer');
      var answer = valInput.val().replace(/\s+/g, '');
      valInput.val('');
      jsavArr.highlight(index);
      jsavArr.value(index, parseInt(answer));
      valInput.focus();
    }
  }

  //removes all jsav elements and resets other vars
  function clearAllJsavObj(){
    if(jsavElements){
      jsavElements.forEach(function(element) {
        element.clear();
      });
    }
    jsavElements = [];
    currentTopMargin = 0;
    mainVarNum = 0;
    mainIndex = null;

    fooIndex = mainIndex = null;
    classVars = {};
    classLabels = {};
    mainVars = {};
    mainLabels = {};
    mainVarNum = 0;
    fooVarNames = [];
    fooVars = {};
    fooLabels = {};
    currentLineMain = 0;
    currentLineFoo = 0;
    output = '';
  }







  // Process About button: Pop up a message with an Alert
  function about() {
    alert(ODSA.AV.aboutstring(interpret(".avTitle"), interpret("av_Authors")));
  }

  // generates the model answer
  function modelSolution(modeljsavAV) {

  }

  // Process reset button: Re-initialize everything
  function initialize() {
    CallByAllFive.init();
    clearAllJsavObj();
    av.umsg("Directions: First, type the evaluated value of the right hand side. "+
            "Then click the location where that value will be stored");

    var codeLines = CallByAllFive.expression.split('<br />');
    for(var i = 0; i < codeLines.length; i++){
      if(mainIndex != null){
        if(codeLines[i].trim().startsWith('int')){
          mainVarNum++;
        }
      }
      if(codeLines[i].indexOf('void foo') !== -1){
        currentLineFoo = fooIndex = i + 1; // +1 because JSAV
      }
      else if(codeLines[i].indexOf('int main') !== -1){
        currentLineMain = mainIndex = i + 1;
      }
    }

    var pseudo = av.code(codeLines,
      {left: leftMargin, top: topMargin, lineNumbers: false}
    );
    jsavElements.push(pseudo)

    for(var i = 0; i < fooIndex - 1; i++){
      if(codeLines[i]){
        var name = codeLines[i].split(' ')[1].charAt(0);
        var varVal = getRightSideValue([classVars], codeLines[i]);
        classLabels[name] = av.label(name,
          {
            relativeTo:pseudo, anchor:"right top", myAnchor:"left top",
            left: leftMargin, top: currentTopMargin
          }
        );
        classVars[name] = av.ds.array(varVal.value,
          {
            indexed: varVal.value.length > 1,relativeTo:classLabels[name], anchor:"right top",
            myAnchor:"left top", left: labelMargin,
            top:-1*jsavArrayOffset
          }//right center and left center don't work for arrays larger than 1.
           //JSAV please fix
        );
        jsavElements.push(classLabels[name],classVars[name])
        currentTopMargin += lineHeight;
      }
    }
    currentTopMargin += lineHeight;


    jsavElements.push(av.label("main",
      {
        relativeTo:pseudo, anchor:"right top", myAnchor:"left top",
        left: leftMargin, top: currentTopMargin
      }
    ));

    var fooLabel = av.label("foo",
      {
        relativeTo:pseudo, anchor:"right top", myAnchor:"left top",
        left: leftMargin+boxWidth+boxPadding*2, top: currentTopMargin
      }
    );
    jsavElements.push(fooLabel);

    currentTopMargin += lineHeight;

    fooVarNames = getVarNamesFromPrototype(codeLines[fooIndex-1]);
    var numVars = Math.max(fooVarNames.length,mainVarNum);

    //numVars = Math.max(numVars,/\(([^)]+)\)/)
    var mainBox = av.g.rect(2*leftMargin+pseudo.element[0].clientWidth,
                            currentTopMargin+topMargin,
                            boxWidth,
                            lineHeight*numVars+boxPadding*numVars
                          );
    var fooBox = av.g.rect(2*leftMargin+pseudo.element[0].clientWidth+boxWidth+
                              boxPadding*2,
                            currentTopMargin+topMargin,
                            boxWidth,
                            lineHeight*numVars+boxPadding*numVars
                          );
    jsavElements.push(mainBox, fooBox);

    currentFooTopMargin = currentTopMargin;

    while(codeLines[currentLineMain].indexOf('foo') === -1){
      if(codeLines[currentLineMain]){
        var mainVarName = codeLines[currentLineMain].trim().split(' ')[1].charAt(0);
        var varVal = getRightSideValue([mainVars, classVars],
                                       codeLines[currentLineMain]);
        mainLabels[mainVarName] = av.label(mainVarName,
          {
            relativeTo:pseudo, anchor:"right top", myAnchor:"left top",
            left: leftMargin+boxPadding, top: currentTopMargin
          }
        );
        mainVars[mainVarName] = av.ds.array(varVal.value,
          {
            indexed: varVal.value.length > 1,relativeTo:mainLabels[mainVarName],
            anchor:"right top", myAnchor:"left top", left: labelMargin,
            top:-1*jsavArrayOffset
          }//JSAV please fix
        );
        jsavElements.push(mainLabels[mainVarName], mainVars[mainVarName])
        currentTopMargin += lineHeight;
      }
      currentLineMain++;
    }

    var fooPassedIn = getVarNamesFromPrototype(codeLines[currentLineMain++]);

    var fooPassedInValues = [];

    for(var i=0; i<fooPassedIn.length; i++){
      fooPassedInValues.push(getValueOfVar([mainVars, classVars], fooPassedIn[i])['value']);
    }

    for(var i=0; i<fooVarNames.length; i++){
      fooLabels[fooVarNames[i]] = av.label(fooVarNames[i],
        {
          relativeTo:pseudo, anchor:"right top", myAnchor:"left top",
          left: leftMargin+boxWidth+3*boxPadding, top: currentFooTopMargin
        }
      );
      fooVars[fooVarNames[i]] = av.ds.array([fooPassedInValues[i]],
        {
          indexed: false,relativeTo:fooLabels[fooVarNames[i]], anchor:"right top",
          myAnchor:"left top", left: labelMargin,
          top:-1*jsavArrayOffset
        }
      );
      jsavElements.push(fooLabels[fooVarNames[i]], fooVars[fooVarNames[i]])
      currentFooTopMargin += lineHeight;
    }

    var jsavArrs = {
      classVars,
      mainVars,
      fooVars
    }

    for(var key in jsavArrs){
      for(var vararr in jsavArrs[key]){
        vararr = jsavArrs[key][vararr]
        vararr.click(clickHandler(vararr));
      }
    }

    return jsavArrs;
  }

  // function that will be called by the exercise if continuous feedback mode
  // is used and the fix errors mode is on.
  function fixState(modelState) {
  }

  // Click handler for all array elements.
   function arrayClickHandler(index) {
   }

   // Connect the action callbacks to the HTML entities
   $('#help').click(help);
   $('#about').click(about);

   var config = ODSA.UTILS.loadConfig(),
       interpret = config.interpreter,       // get the interpreter
       settings = config.getSettings();      // Settings for the AV

   var av = new JSAV($('.avcontainer'), {settings: settings});

   var exer = av.exercise(modelSolution, initialize,
                {compare: {"class": "jsavhighlight"},
                 controls: $('.jsavexercisecontrols'), fix: fixState});


   exer.reset();

})