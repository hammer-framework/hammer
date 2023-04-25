import{a as Y}from"./codemirror.es-2fb7d200.js";import{a as $}from"./searchcursor.es-34813366.js";import{a as z}from"./matchbrackets.es-41794d05.js";import"./index-17331a0b.js";var G=Object.defineProperty,v=(m,A)=>G(m,"name",{value:A,configurable:!0});function E(m,A){return A.forEach(function(h){h&&typeof h!="string"&&!Array.isArray(h)&&Object.keys(h).forEach(function(a){if(a!=="default"&&!(a in m)){var f=Object.getOwnPropertyDescriptor(h,a);Object.defineProperty(m,a,f.get?f:{enumerable:!0,get:function(){return h[a]}})}})}),Object.freeze(Object.defineProperty(m,Symbol.toStringTag,{value:"Module"}))}v(E,"_mergeNamespaces");var H={exports:{}};(function(m,A){(function(h){h(Y.exports,$.exports,z.exports)})(function(h){var a=h.commands,f=h.Pos;function O(e,t,n){if(n<0&&t.ch==0)return e.clipPos(f(t.line-1));var r=e.getLine(t.line);if(n>0&&t.ch>=r.length)return e.clipPos(f(t.line+1,0));for(var l="start",i,o=t.ch,s=o,u=n<0?0:r.length,d=0;s!=u;s+=n,d++){var p=r.charAt(n<0?s-1:s),c=p!="_"&&h.isWordChar(p)?"w":"o";if(c=="w"&&p.toUpperCase()==p&&(c="W"),l=="start")c!="o"?(l="in",i=c):o=s+n;else if(l=="in"&&i!=c){if(i=="w"&&c=="W"&&n<0&&s--,i=="W"&&c=="w"&&n>0)if(s==o+1){i="w";continue}else s--;break}}return f(t.line,s)}v(O,"findPosSubword");function T(e,t){e.extendSelectionsBy(function(n){return e.display.shift||e.doc.extend||n.empty()?O(e.doc,n.head,t):t<0?n.from():n.to()})}v(T,"moveSubword"),a.goSubwordLeft=function(e){T(e,-1)},a.goSubwordRight=function(e){T(e,1)},a.scrollLineUp=function(e){var t=e.getScrollInfo();if(!e.somethingSelected()){var n=e.lineAtHeight(t.top+t.clientHeight,"local");e.getCursor().line>=n&&e.execCommand("goLineUp")}e.scrollTo(null,t.top-e.defaultTextHeight())},a.scrollLineDown=function(e){var t=e.getScrollInfo();if(!e.somethingSelected()){var n=e.lineAtHeight(t.top,"local")+1;e.getCursor().line<=n&&e.execCommand("goLineDown")}e.scrollTo(null,t.top+e.defaultTextHeight())},a.splitSelectionByLine=function(e){for(var t=e.listSelections(),n=[],r=0;r<t.length;r++)for(var l=t[r].from(),i=t[r].to(),o=l.line;o<=i.line;++o)i.line>l.line&&o==i.line&&i.ch==0||n.push({anchor:o==l.line?l:f(o,0),head:o==i.line?i:f(o)});e.setSelections(n,0)},a.singleSelectionTop=function(e){var t=e.listSelections()[0];e.setSelection(t.anchor,t.head,{scroll:!1})},a.selectLine=function(e){for(var t=e.listSelections(),n=[],r=0;r<t.length;r++){var l=t[r];n.push({anchor:f(l.from().line,0),head:f(l.to().line+1,0)})}e.setSelections(n)};function y(e,t){if(e.isReadOnly())return h.Pass;e.operation(function(){for(var n=e.listSelections().length,r=[],l=-1,i=0;i<n;i++){var o=e.listSelections()[i].head;if(!(o.line<=l)){var s=f(o.line+(t?0:1),0);e.replaceRange(`
`,s,null,"+insertLine"),e.indentLine(s.line,null,!0),r.push({head:s,anchor:s}),l=o.line+1}}e.setSelections(r)}),e.execCommand("indentAuto")}v(y,"insertLine"),a.insertLineAfter=function(e){return y(e,!1)},a.insertLineBefore=function(e){return y(e,!0)};function R(e,t){for(var n=t.ch,r=n,l=e.getLine(t.line);n&&h.isWordChar(l.charAt(n-1));)--n;for(;r<l.length&&h.isWordChar(l.charAt(r));)++r;return{from:f(t.line,n),to:f(t.line,r),word:l.slice(n,r)}}v(R,"wordAt"),a.selectNextOccurrence=function(e){var t=e.getCursor("from"),n=e.getCursor("to"),r=e.state.sublimeFindFullWord==e.doc.sel;if(h.cmpPos(t,n)==0){var l=R(e,t);if(!l.word)return;e.setSelection(l.from,l.to),r=!0}else{var i=e.getRange(t,n),o=r?new RegExp("\\b"+i+"\\b"):i,s=e.getSearchCursor(o,n),u=s.findNext();if(u||(s=e.getSearchCursor(o,f(e.firstLine(),0)),u=s.findNext()),!u||N(e.listSelections(),s.from(),s.to()))return;e.addSelection(s.from(),s.to())}r&&(e.state.sublimeFindFullWord=e.doc.sel)},a.skipAndSelectNextOccurrence=function(e){var t=e.getCursor("anchor"),n=e.getCursor("head");a.selectNextOccurrence(e),h.cmpPos(t,n)!=0&&e.doc.setSelections(e.doc.listSelections().filter(function(r){return r.anchor!=t||r.head!=n}))};function x(e,t){for(var n=e.listSelections(),r=[],l=0;l<n.length;l++){var i=n[l],o=e.findPosV(i.anchor,t,"line",i.anchor.goalColumn),s=e.findPosV(i.head,t,"line",i.head.goalColumn);o.goalColumn=i.anchor.goalColumn!=null?i.anchor.goalColumn:e.cursorCoords(i.anchor,"div").left,s.goalColumn=i.head.goalColumn!=null?i.head.goalColumn:e.cursorCoords(i.head,"div").left;var u={anchor:o,head:s};r.push(i),r.push(u)}e.setSelections(r)}v(x,"addCursorToSelection"),a.addCursorToPrevLine=function(e){x(e,-1)},a.addCursorToNextLine=function(e){x(e,1)};function N(e,t,n){for(var r=0;r<e.length;r++)if(h.cmpPos(e[r].from(),t)==0&&h.cmpPos(e[r].to(),n)==0)return!0;return!1}v(N,"isSelectedRange");var W="(){}[]";function P(e){for(var t=e.listSelections(),n=[],r=0;r<t.length;r++){var l=t[r],i=l.head,o=e.scanForBracket(i,-1);if(!o)return!1;for(;;){var s=e.scanForBracket(i,1);if(!s)return!1;if(s.ch==W.charAt(W.indexOf(o.ch)+1)){var u=f(o.pos.line,o.pos.ch+1);if(h.cmpPos(u,l.from())==0&&h.cmpPos(s.pos,l.to())==0){if(o=e.scanForBracket(o.pos,-1),!o)return!1}else{n.push({anchor:u,head:s.pos});break}}i=f(s.pos.line,s.pos.ch+1)}}return e.setSelections(n),!0}v(P,"selectBetweenBrackets"),a.selectScope=function(e){P(e)||e.execCommand("selectAll")},a.selectBetweenBrackets=function(e){if(!P(e))return h.Pass};function K(e){return e?/\bpunctuation\b/.test(e)?e:void 0:null}v(K,"puncType"),a.goToBracket=function(e){e.extendSelectionsBy(function(t){var n=e.scanForBracket(t.head,1,K(e.getTokenTypeAt(t.head)));if(n&&h.cmpPos(n.pos,t.head)!=0)return n.pos;var r=e.scanForBracket(t.head,-1,K(e.getTokenTypeAt(f(t.head.line,t.head.ch+1))));return r&&f(r.pos.line,r.pos.ch+1)||t.head})},a.swapLineUp=function(e){if(e.isReadOnly())return h.Pass;for(var t=e.listSelections(),n=[],r=e.firstLine()-1,l=[],i=0;i<t.length;i++){var o=t[i],s=o.from().line-1,u=o.to().line;l.push({anchor:f(o.anchor.line-1,o.anchor.ch),head:f(o.head.line-1,o.head.ch)}),o.to().ch==0&&!o.empty()&&--u,s>r?n.push(s,u):n.length&&(n[n.length-1]=u),r=u}e.operation(function(){for(var d=0;d<n.length;d+=2){var p=n[d],c=n[d+1],b=e.getLine(p);e.replaceRange("",f(p,0),f(p+1,0),"+swapLine"),c>e.lastLine()?e.replaceRange(`
`+b,f(e.lastLine()),null,"+swapLine"):e.replaceRange(b+`
`,f(c,0),null,"+swapLine")}e.setSelections(l),e.scrollIntoView()})},a.swapLineDown=function(e){if(e.isReadOnly())return h.Pass;for(var t=e.listSelections(),n=[],r=e.lastLine()+1,l=t.length-1;l>=0;l--){var i=t[l],o=i.to().line+1,s=i.from().line;i.to().ch==0&&!i.empty()&&o--,o<r?n.push(o,s):n.length&&(n[n.length-1]=s),r=s}e.operation(function(){for(var u=n.length-2;u>=0;u-=2){var d=n[u],p=n[u+1],c=e.getLine(d);d==e.lastLine()?e.replaceRange("",f(d-1),f(d),"+swapLine"):e.replaceRange("",f(d,0),f(d+1,0),"+swapLine"),e.replaceRange(c+`
`,f(p,0),null,"+swapLine")}e.scrollIntoView()})},a.toggleCommentIndented=function(e){e.toggleComment({indent:!0})},a.joinLines=function(e){for(var t=e.listSelections(),n=[],r=0;r<t.length;r++){for(var l=t[r],i=l.from(),o=i.line,s=l.to().line;r<t.length-1&&t[r+1].from().line==s;)s=t[++r].to().line;n.push({start:o,end:s,anchor:!l.empty()&&i})}e.operation(function(){for(var u=0,d=[],p=0;p<n.length;p++){for(var c=n[p],b=c.anchor&&f(c.anchor.line-u,c.anchor.ch),w,g=c.start;g<=c.end;g++){var S=g-u;g==c.end&&(w=f(S,e.getLine(S).length+1)),S<e.lastLine()&&(e.replaceRange(" ",f(S),f(S+1,/^\s*/.exec(e.getLine(S+1))[0].length)),++u)}d.push({anchor:b||w,head:w})}e.setSelections(d,0)})},a.duplicateLine=function(e){e.operation(function(){for(var t=e.listSelections().length,n=0;n<t;n++){var r=e.listSelections()[n];r.empty()?e.replaceRange(e.getLine(r.head.line)+`
`,f(r.head.line,0)):e.replaceRange(e.getRange(r.from(),r.to()),r.from())}e.scrollIntoView()})};function B(e,t,n){if(e.isReadOnly())return h.Pass;for(var r=e.listSelections(),l=[],i,o=0;o<r.length;o++){var s=r[o];if(!s.empty()){for(var u=s.from().line,d=s.to().line;o<r.length-1&&r[o+1].from().line==d;)d=r[++o].to().line;r[o].to().ch||d--,l.push(u,d)}}l.length?i=!0:l.push(e.firstLine(),e.lastLine()),e.operation(function(){for(var p=[],c=0;c<l.length;c+=2){var b=l[c],w=l[c+1],g=f(b,0),S=f(w),D=e.getRange(g,S,!1);t?D.sort(function(k,L){return k<L?-n:k==L?0:n}):D.sort(function(k,L){var M=k.toUpperCase(),_=L.toUpperCase();return M!=_&&(k=M,L=_),k<L?-n:k==L?0:n}),e.replaceRange(D,g,S),i&&p.push({anchor:g,head:f(w+1,0)})}i&&e.setSelections(p,0)})}v(B,"sortLines"),a.sortLines=function(e){B(e,!0,1)},a.reverseSortLines=function(e){B(e,!0,-1)},a.sortLinesInsensitive=function(e){B(e,!1,1)},a.reverseSortLinesInsensitive=function(e){B(e,!1,-1)},a.nextBookmark=function(e){var t=e.state.sublimeBookmarks;if(t)for(;t.length;){var n=t.shift(),r=n.find();if(r)return t.push(n),e.setSelection(r.from,r.to)}},a.prevBookmark=function(e){var t=e.state.sublimeBookmarks;if(t)for(;t.length;){t.unshift(t.pop());var n=t[t.length-1].find();if(!n)t.pop();else return e.setSelection(n.from,n.to)}},a.toggleBookmark=function(e){for(var t=e.listSelections(),n=e.state.sublimeBookmarks||(e.state.sublimeBookmarks=[]),r=0;r<t.length;r++){for(var l=t[r].from(),i=t[r].to(),o=t[r].empty()?e.findMarksAt(l):e.findMarks(l,i),s=0;s<o.length;s++)if(o[s].sublimeBookmark){o[s].clear();for(var u=0;u<n.length;u++)n[u]==o[s]&&n.splice(u--,1);break}s==o.length&&n.push(e.markText(l,i,{sublimeBookmark:!0,clearWhenEmpty:!1}))}},a.clearBookmarks=function(e){var t=e.state.sublimeBookmarks;if(t)for(var n=0;n<t.length;n++)t[n].clear();t.length=0},a.selectBookmarks=function(e){var t=e.state.sublimeBookmarks,n=[];if(t)for(var r=0;r<t.length;r++){var l=t[r].find();l?n.push({anchor:l.from,head:l.to}):t.splice(r--,0)}n.length&&e.setSelections(n,0)};function F(e,t){e.operation(function(){for(var n=e.listSelections(),r=[],l=[],i=0;i<n.length;i++){var o=n[i];o.empty()?(r.push(i),l.push("")):l.push(t(e.getRange(o.from(),o.to())))}e.replaceSelections(l,"around","case");for(var i=r.length-1,s;i>=0;i--){var o=n[r[i]];if(!(s&&h.cmpPos(o.head,s)>0)){var u=R(e,o.head);s=u.from,e.replaceRange(t(u.word),u.from,u.to)}}})}v(F,"modifyWordOrSelection"),a.smartBackspace=function(e){if(e.somethingSelected())return h.Pass;e.operation(function(){for(var t=e.listSelections(),n=e.getOption("indentUnit"),r=t.length-1;r>=0;r--){var l=t[r].head,i=e.getRange({line:l.line,ch:0},l),o=h.countColumn(i,null,e.getOption("tabSize")),s=e.findPosH(l,-1,"char",!1);if(i&&!/\S/.test(i)&&o%n==0){var u=new f(l.line,h.findColumn(i,o-n,n));u.ch!=l.ch&&(s=u)}e.replaceRange("",s,l,"+delete")}})},a.delLineRight=function(e){e.operation(function(){for(var t=e.listSelections(),n=t.length-1;n>=0;n--)e.replaceRange("",t[n].anchor,f(t[n].to().line),"+delete");e.scrollIntoView()})},a.upcaseAtCursor=function(e){F(e,function(t){return t.toUpperCase()})},a.downcaseAtCursor=function(e){F(e,function(t){return t.toLowerCase()})},a.setSublimeMark=function(e){e.state.sublimeMark&&e.state.sublimeMark.clear(),e.state.sublimeMark=e.setBookmark(e.getCursor())},a.selectToSublimeMark=function(e){var t=e.state.sublimeMark&&e.state.sublimeMark.find();t&&e.setSelection(e.getCursor(),t)},a.deleteToSublimeMark=function(e){var t=e.state.sublimeMark&&e.state.sublimeMark.find();if(t){var n=e.getCursor(),r=t;if(h.cmpPos(n,r)>0){var l=r;r=n,n=l}e.state.sublimeKilled=e.getRange(n,r),e.replaceRange("",n,r)}},a.swapWithSublimeMark=function(e){var t=e.state.sublimeMark&&e.state.sublimeMark.find();t&&(e.state.sublimeMark.clear(),e.state.sublimeMark=e.setBookmark(e.getCursor()),e.setCursor(t))},a.sublimeYank=function(e){e.state.sublimeKilled!=null&&e.replaceSelection(e.state.sublimeKilled,null,"paste")},a.showInCenter=function(e){var t=e.cursorCoords(null,"local");e.scrollTo(null,(t.top+t.bottom)/2-e.getScrollInfo().clientHeight/2)};function U(e){var t=e.getCursor("from"),n=e.getCursor("to");if(h.cmpPos(t,n)==0){var r=R(e,t);if(!r.word)return;t=r.from,n=r.to}return{from:t,to:n,query:e.getRange(t,n),word:r}}v(U,"getTarget");function I(e,t){var n=U(e);if(n){var r=n.query,l=e.getSearchCursor(r,t?n.to:n.from);(t?l.findNext():l.findPrevious())?e.setSelection(l.from(),l.to()):(l=e.getSearchCursor(r,t?f(e.firstLine(),0):e.clipPos(f(e.lastLine()))),(t?l.findNext():l.findPrevious())?e.setSelection(l.from(),l.to()):n.word&&e.setSelection(n.from,n.to))}}v(I,"findAndGoTo"),a.findUnder=function(e){I(e,!0)},a.findUnderPrevious=function(e){I(e,!1)},a.findAllUnder=function(e){var t=U(e);if(t){for(var n=e.getSearchCursor(t.query),r=[],l=-1;n.findNext();)r.push({anchor:n.from(),head:n.to()}),n.from().line<=t.from.line&&n.from().ch<=t.from.ch&&l++;e.setSelections(r,l)}};var C=h.keyMap;C.macSublime={"Cmd-Left":"goLineStartSmart","Shift-Tab":"indentLess","Shift-Ctrl-K":"deleteLine","Alt-Q":"wrapLines","Ctrl-Left":"goSubwordLeft","Ctrl-Right":"goSubwordRight","Ctrl-Alt-Up":"scrollLineUp","Ctrl-Alt-Down":"scrollLineDown","Cmd-L":"selectLine","Shift-Cmd-L":"splitSelectionByLine",Esc:"singleSelectionTop","Cmd-Enter":"insertLineAfter","Shift-Cmd-Enter":"insertLineBefore","Cmd-D":"selectNextOccurrence","Shift-Cmd-Space":"selectScope","Shift-Cmd-M":"selectBetweenBrackets","Cmd-M":"goToBracket","Cmd-Ctrl-Up":"swapLineUp","Cmd-Ctrl-Down":"swapLineDown","Cmd-/":"toggleCommentIndented","Cmd-J":"joinLines","Shift-Cmd-D":"duplicateLine",F5:"sortLines","Shift-F5":"reverseSortLines","Cmd-F5":"sortLinesInsensitive","Shift-Cmd-F5":"reverseSortLinesInsensitive",F2:"nextBookmark","Shift-F2":"prevBookmark","Cmd-F2":"toggleBookmark","Shift-Cmd-F2":"clearBookmarks","Alt-F2":"selectBookmarks",Backspace:"smartBackspace","Cmd-K Cmd-D":"skipAndSelectNextOccurrence","Cmd-K Cmd-K":"delLineRight","Cmd-K Cmd-U":"upcaseAtCursor","Cmd-K Cmd-L":"downcaseAtCursor","Cmd-K Cmd-Space":"setSublimeMark","Cmd-K Cmd-A":"selectToSublimeMark","Cmd-K Cmd-W":"deleteToSublimeMark","Cmd-K Cmd-X":"swapWithSublimeMark","Cmd-K Cmd-Y":"sublimeYank","Cmd-K Cmd-C":"showInCenter","Cmd-K Cmd-G":"clearBookmarks","Cmd-K Cmd-Backspace":"delLineLeft","Cmd-K Cmd-1":"foldAll","Cmd-K Cmd-0":"unfoldAll","Cmd-K Cmd-J":"unfoldAll","Ctrl-Shift-Up":"addCursorToPrevLine","Ctrl-Shift-Down":"addCursorToNextLine","Cmd-F3":"findUnder","Shift-Cmd-F3":"findUnderPrevious","Alt-F3":"findAllUnder","Shift-Cmd-[":"fold","Shift-Cmd-]":"unfold","Cmd-I":"findIncremental","Shift-Cmd-I":"findIncrementalReverse","Cmd-H":"replace",F3:"findNext","Shift-F3":"findPrev",fallthrough:"macDefault"},h.normalizeKeyMap(C.macSublime),C.pcSublime={"Shift-Tab":"indentLess","Shift-Ctrl-K":"deleteLine","Alt-Q":"wrapLines","Ctrl-T":"transposeChars","Alt-Left":"goSubwordLeft","Alt-Right":"goSubwordRight","Ctrl-Up":"scrollLineUp","Ctrl-Down":"scrollLineDown","Ctrl-L":"selectLine","Shift-Ctrl-L":"splitSelectionByLine",Esc:"singleSelectionTop","Ctrl-Enter":"insertLineAfter","Shift-Ctrl-Enter":"insertLineBefore","Ctrl-D":"selectNextOccurrence","Shift-Ctrl-Space":"selectScope","Shift-Ctrl-M":"selectBetweenBrackets","Ctrl-M":"goToBracket","Shift-Ctrl-Up":"swapLineUp","Shift-Ctrl-Down":"swapLineDown","Ctrl-/":"toggleCommentIndented","Ctrl-J":"joinLines","Shift-Ctrl-D":"duplicateLine",F9:"sortLines","Shift-F9":"reverseSortLines","Ctrl-F9":"sortLinesInsensitive","Shift-Ctrl-F9":"reverseSortLinesInsensitive",F2:"nextBookmark","Shift-F2":"prevBookmark","Ctrl-F2":"toggleBookmark","Shift-Ctrl-F2":"clearBookmarks","Alt-F2":"selectBookmarks",Backspace:"smartBackspace","Ctrl-K Ctrl-D":"skipAndSelectNextOccurrence","Ctrl-K Ctrl-K":"delLineRight","Ctrl-K Ctrl-U":"upcaseAtCursor","Ctrl-K Ctrl-L":"downcaseAtCursor","Ctrl-K Ctrl-Space":"setSublimeMark","Ctrl-K Ctrl-A":"selectToSublimeMark","Ctrl-K Ctrl-W":"deleteToSublimeMark","Ctrl-K Ctrl-X":"swapWithSublimeMark","Ctrl-K Ctrl-Y":"sublimeYank","Ctrl-K Ctrl-C":"showInCenter","Ctrl-K Ctrl-G":"clearBookmarks","Ctrl-K Ctrl-Backspace":"delLineLeft","Ctrl-K Ctrl-1":"foldAll","Ctrl-K Ctrl-0":"unfoldAll","Ctrl-K Ctrl-J":"unfoldAll","Ctrl-Alt-Up":"addCursorToPrevLine","Ctrl-Alt-Down":"addCursorToNextLine","Ctrl-F3":"findUnder","Shift-Ctrl-F3":"findUnderPrevious","Alt-F3":"findAllUnder","Shift-Ctrl-[":"fold","Shift-Ctrl-]":"unfold","Ctrl-I":"findIncremental","Shift-Ctrl-I":"findIncrementalReverse","Ctrl-H":"replace",F3:"findNext","Shift-F3":"findPrev",fallthrough:"pcDefault"},h.normalizeKeyMap(C.pcSublime);var V=C.default==C.macDefault;C.sublime=V?C.macSublime:C.pcSublime})})();var J=H.exports,Z=E({__proto__:null,default:J},[H.exports]);export{Z as s};
