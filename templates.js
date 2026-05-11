// templates.js
const CONTROL_BOX_HTML = `
    <div class="ctrl-header" id="ctrl-drag-handle">
        <b>피팅 리모컨</b>
        <div class="header-actions">
            <button class="visibility-btn" id="btn-visibility">숨김</button>
            <button class="min-btn" id="btn-min">─</button>
        </div>
    </div>
    <div class="ctrl-content" id="ctrl-content">
        <button id="btn-upload" style="background:#28a745; font-weight: bold; padding: 10px; margin-bottom: 4px;">📷 사진 업로드</button>
        
        <div class="section-title">조작 모드</div>
        <div class="mode-grid">
            <button id="mode-move" class="active">이동</button>
            <button id="mode-erase">지우개</button>
            <button id="btn-flip">좌우 반전</button>
            <button id="btn-reset">초기화</button>
        </div>

        <div class="section-title">사진 톤 보정</div>
        <div class="slider-item"><label>밝기</label><input type="range" id="filter-bright" min="0.5" max="1.5" step="0.01" value="1"></div>
        <div class="slider-item"><label>대비</label><input type="range" id="filter-contrast" min="0.5" max="1.5" step="0.01" value="1"></div>
        <div class="slider-item"><label>채도</label><input type="range" id="filter-saturate" min="0" max="2" step="0.01" value="1"></div>
        
        <div class="section-title">룩 저장 (1-6)</div>
        <div class="slot-grid">
            <button class="save-btn" data-slot="1">1번 저장</button><button class="save-btn" data-slot="2">2번 저장</button><button class="save-btn" data-slot="3">3번 저장</button>
            <button class="save-btn" data-slot="4">4번 저장</button><button class="save-btn" data-slot="5">5번 저장</button><button class="save-btn" data-slot="6">6번 저장</button>
        </div>
        
        <div class="section-title">룩 불러오기</div>
        <div class="slot-grid">
            <button class="slot-btn" data-slot="1" id="load-1">룩 1</button><button class="slot-btn" data-slot="2" id="load-2">룩 2</button><button class="slot-btn" data-slot="3" id="load-3">룩 3</button>
            <button class="slot-btn" data-slot="4" id="load-4">룩 4</button><button class="slot-btn" data-slot="5" id="load-5">룩 5</button><button class="slot-btn" data-slot="6" id="load-6">룩 6</button>
        </div>

        <div class="section-title">세부 조절</div>
        <div class="slider-item"><label>지우개</label><input type="range" id="range-brush" min="5" max="120" value="40"></div>
        <div class="slider-item"><label>크기</label><input type="range" id="range-scale" min="0.1" max="5" step="0.05" value="1"></div>
        <div class="slider-item"><label>기울기</label><input type="range" id="range-rotate" min="-180" max="180" value="0"></div>
        <div class="slider-item"><label>투명도</label><input type="range" id="range-opacity" min="0.1" max="1" step="0.1" value="1"></div>
    </div>
`;
