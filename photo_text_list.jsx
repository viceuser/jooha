#target photoshop

app.bringToFront();

try {
    var doc = app.activeDocument;
    
    // 텍스트 레이어가 선택되어 있는지 확인
    if (doc.activeLayer.kind == LayerKind.TEXT) {
        var textLayer = doc.activeLayer;
        var textItem = textLayer.textItem;
        var textContent = textItem.contents;
        
        // 새로운 텍스트 레이어 생성
        var newTextLayer = doc.artLayers.add();
        newTextLayer.kind = LayerKind.TEXT;
        var newTextItem = newTextLayer.textItem;
        
        // 원본 텍스트 레이어 숨기기
        textLayer.visible = false;
        
        // 글자와 숫자를 분리하여 처리
        var currentPos = 0;
        
        for (var i = 0; i < textContent.length; i++) {
            var char = textContent.charAt(i);
            
            if (char.match(/[0-9]/)) {
                // 숫자인 경우 분홍색 + 효과 적용
                createStyledText(char, 255, 0, 255, currentPos, textItem, true); // true = 숫자
                currentPos += textItem.size * 0.8;
                
            } else if (char === " ") {
                // 공백인 경우
                currentPos += textItem.size * 0.3;
                
            } else {
                // 글자인 경우 하얀색 + 효과 적용
                createStyledText(char, 255, 255, 255, currentPos, textItem, false); // false = 글자
                currentPos += textItem.size * 0.8;
            }
        }
        
        alert("텍스트 효과가 적용되었습니다!\n글자: 하얀색 + Stroke/Shadow\n숫자: 분홍색 + Bevel/Glow");
        
    } else {
        alert("텍스트 레이어를 선택해주세요!");
    }
    
} catch(e) {
    alert("오류 발생: " + e);
}

// 스타일이 적용된 텍스트 생성 함수
function createStyledText(char, r, g, b, xPos, originalText, isNumber) {
    var doc = app.activeDocument;
    
    // 텍스트 레이어 생성
    var textLayer = doc.artLayers.add();
    textLayer.kind = LayerKind.TEXT;
    var textItem = textLayer.textItem;
    
    // 기본 텍스트 설정
    textItem.contents = char;
    textItem.color = createColor(r, g, b);
    textItem.position = [originalText.position[0] + xPos, originalText.position[1]];
    textItem.font = originalText.font;
    textItem.size = originalText.size;
    
    // 레이어 이름 설정
    textLayer.name = (isNumber ? "Number_" : "Text_") + char;
    
    // 효과 적용
    if (isNumber) {
        // 숫자용 효과: Bevel & Emboss + Glow
        applyBevelEffect(textLayer);
        applyGlowEffect(textLayer);
    } else {
        // 글자용 효과: Stroke + Drop Shadow
        applyStrokeEffect(textLayer);
        applyDropShadow(textLayer);
    }
}

// Bevel & Emboss 효과
function applyBevelEffect(layer) {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    desc.putReference(charIDToTypeID("null"), ref);
    
    var desc2 = new ActionDescriptor();
    desc2.putEnumerated(charIDToTypeID("BlnM"), charIDToTypeID("BlnM"), charIDToTypeID("SftL"));
    desc2.putEnumerated(charIDToTypeID("HglM"), charIDToTypeID("HglM"), charIDToTypeID("Scrn"));
    desc2.putEnumerated(charIDToTypeID("ShdM"), charIDToTypeID("ShdM"), charIDToTypeID("Mltp"));
    desc2.putUnitDouble(charIDToTypeID("HglA"), charIDToTypeID("#Ang"), 120);
    desc2.putUnitDouble(charIDToTypeID("ShdA"), charIDToTypeID("#Ang"), 300);
    desc2.putUnitDouble(charIDToTypeID("HglD"), charIDToTypeID("#Prc"), 50);
    desc2.putUnitDouble(charIDToTypeID("ShdD"), charIDToTypeID("#Prc"), 50);
    desc2.putUnitDouble(charIDToTypeID("HglS"), charIDToTypeID("#Pxl"), 5);
    desc2.putUnitDouble(charIDToTypeID("ShdS"), charIDToTypeID("#Pxl"), 5);
    desc2.putUnitDouble(charIDToTypeID("HglH"), charIDToTypeID("#Prc"), 75);
    desc2.putUnitDouble(charIDToTypeID("ShdH"), charIDToTypeID("#Prc"), 75);
    desc2.putEnumerated(charIDToTypeID("HglT"), charIDToTypeID("HglT"), charIDToTypeID("Lgth"));
    desc2.putEnumerated(charIDToTypeID("ShdT"), charIDToTypeID("ShdT"), charIDToTypeID("Lgth"));
    desc2.putUnitDouble(charIDToTypeID("Sftn"), charIDToTypeID("#Pxl"), 0);
    desc2.putBoolean(charIDToTypeID("Dprt"), false);
    desc2.putBoolean(charIDToTypeID("Inpr"), false);
    
    desc.putObject(charIDToTypeID("T   "), charIDToTypeID("BvlA"), desc2);
    executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
}

// Glow 효과
function applyGlowEffect(layer) {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    desc.putReference(charIDToTypeID("null"), ref);
    
    var desc2 = new ActionDescriptor();
    desc2.putEnumerated(charIDToTypeID("Md  "), charIDToTypeID("BlnM"), charIDToTypeID("Scrn"));
    desc2.putUnitDouble(charIDToTypeID("Opct"), charIDToTypeID("#Prc"), 75);
    desc2.putUnitDouble(charIDToTypeID("Chnc"), charIDToTypeID("#Prc"), 0);
    desc2.putUnitDouble(charIDToTypeID("Scl "), charIDToTypeID("#Prc"), 100);
    desc2.putUnitDouble(charIDToTypeID("Lgh "), charIDToTypeID("#Prc"), 50);
    desc2.putUnitDouble(charIDToTypeID("Scl "), charIDToTypeID("#Prc"), 100);
    desc2.putUnitDouble(charIDToTypeID("Lgh "), charIDToTypeID("#Prc"), 50);
    
    var desc3 = new ActionDescriptor();
    desc3.putDouble(charIDToTypeID("Rd  "), 255);
    desc3.putDouble(charIDToTypeID("Grn "), 100);
    desc3.putDouble(charIDToTypeID("Bl  "), 255);
    desc2.putObject(charIDToTypeID("Clr "), charIDToTypeID("RGBC"), desc3);
    
    desc2.putUnitDouble(charIDToTypeID("blur"), charIDToTypeID("#Pxl"), 10);
    desc2.putUnitDouble(charIDToTypeID("Intn"), charIDToTypeID("#Prc"), 50);
    desc2.putUnitDouble(charIDToTypeID("ShdN"), charIDToTypeID("#Prc"), 0);
    
    desc.putObject(charIDToTypeID("T   "), charIDToTypeID("OrGl"), desc2);
    executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
}

// Stroke 효과
function applyStrokeEffect(layer) {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    desc.putReference(charIDToTypeID("null"), ref);
    
    var desc2 = new ActionDescriptor();
    desc2.putEnumerated(charIDToTypeID("Styl"), charIDToTypeID("FStl"), charIDToTypeID("OutF"));
    desc2.putEnumerated(charIDToTypeID("PntT"), charIDToTypeID("FrFl"), charIDToTypeID("SClr"));
    desc2.putEnumerated(charIDToTypeID("Md  "), charIDToTypeID("BlnM"), charIDToTypeID("Nrml"));
    desc2.putUnitDouble(charIDToTypeID("Opct"), charIDToTypeID("#Prc"), 100);
    desc2.putUnitDouble(charIDToTypeID("Sz  "), charIDToTypeID("#Pxl"), 3);
    
    var desc3 = new ActionDescriptor();
    desc3.putDouble(charIDToTypeID("Rd  "), 0);
    desc3.putDouble(charIDToTypeID("Grn "), 0);
    desc3.putDouble(charIDToTypeID("Bl  "), 0);
    desc2.putObject(charIDToTypeID("Clr "), charIDToTypeID("RGBC"), desc3);
    
    desc.putObject(charIDToTypeID("T   "), charIDToTypeID("FrFX"), desc2);
    executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
}

// Drop Shadow 효과
function applyDropShadow(layer) {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
    desc.putReference(charIDToTypeID("null"), ref);
    
    var desc2 = new ActionDescriptor();
    desc2.putEnumerated(charIDToTypeID("Md  "), charIDToTypeID("BlnM"), charIDToTypeID("Mltp"));
    desc2.putUnitDouble(charIDToTypeID("Opct"), charIDToTypeID("#Prc"), 75);
    desc2.putBoolean(charIDToTypeID("uglg"), true);
    desc2.putUnitDouble(charIDToTypeID("lagl"), charIDToTypeID("#Ang"), 120);
    desc2.putUnitDouble(charIDToTypeID("Dstn"), charIDToTypeID("#Pxl"), 5);
    desc2.putUnitDouble(charIDToTypeID("Ckmt"), charIDToTypeID("#Pxl"), 0);
    desc2.putUnitDouble(charIDToTypeID("blur"), charIDToTypeID("#Pxl"), 5);
    desc2.putUnitDouble(charIDToTypeID("Nose"), charIDToTypeID("#Prc"), 0);
    desc2.putBoolean(charIDToTypeID("AntA"), false);
    desc2.putUnitDouble(charIDToTypeID("TrnS"), charIDToTypeID("#Prc"), 0);
    desc2.putBoolean(charIDToTypeID("layerConceals"), true);
    
    var desc3 = new ActionDescriptor();
    desc3.putDouble(charIDToTypeID("Rd  "), 0);
    desc3.putDouble(charIDToTypeID("Grn "), 0);
    desc3.putDouble(charIDToTypeID("Bl  "), 0);
    desc2.putObject(charIDToTypeID("Clr "), charIDToTypeID("RGBC"), desc3);
    
    desc.putObject(charIDToTypeID("T   "), charIDToTypeID("DrSh"), desc2);
    executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
}

// 색상 생성 함수
function createColor(r, g, b) {
    var color = new SolidColor();
    color.rgb.red = r;
    color.rgb.green = g;
    color.rgb.blue = b;
    return color;
}
