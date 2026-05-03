// styles.js
const UI_STYLES = `
    .hide-cursor { cursor: none !important; }
    canvas { display: block; width: 200px; transition: transform 0.1s; }
    .ctrl-header { display: flex; justify-content: space-between; align-items: center; cursor: move; border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 4px; }
    .ctrl-header b { color: #00d4ff; font-size: 13px; pointer-events: none; }
    .min-btn { 
        all: unset; cursor: pointer; background: #444; color: white; border-radius: 4px; 
        width: 24px !important; height: 24px !important; min-width: 24px !important; max-width: 24px !important;
        display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;
    }
    .min-btn:hover { background: #666; }
    .ctrl-content { display: flex; flex-direction: column; gap: 8px; }
    .mode-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; }
    .slot-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
    button { cursor: pointer; background: #333; color: white; border: none; padding: 8px 2px; border-radius: 6px; font-size: 10px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    button.active { background: #007bff; font-weight: bold; }
    .save-btn { background: #4a148c; border: 1px solid #6a1b9a; }
    .save-btn:hover { background: #6a1b9a; }
    .slot-btn { background: #263238; border: 1px solid #37474f; }
    .slot-btn:hover { background: #37474f; }
    .slider-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .slider-item label { width: 50px; font-size: 10px; color: #aaa; }
    input[type="range"] { flex: 1; cursor: pointer; }
    .section-title { font-size: 10px; color: #555; font-weight: bold; margin-top: 6px; border-bottom: 1px solid #222; padding-bottom: 2px; text-transform: uppercase; }
    #brush-guide { position: fixed; border: 2px solid #00d4ff; border-radius: 50%; pointer-events: none; display: none; z-index: 2147483647; transform: translate(-50%, -50%); background: rgba(0, 212, 255, 0.2); }
`;