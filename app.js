// 1. HTML要素の取得
// JavaScriptで操作したい要素をIDを使って取得します
const companyNameInput = document.getElementById('companyName');
const motivationTextInput = document.getElementById('motivationText');
const saveButton = document.getElementById('saveButton');
const charCountDisplay = document.getElementById('charCount');
const savedListContainer = document.getElementById('savedList');

// ローカルストレージで使用するキー名
const STORAGE_KEY = 'esDrafts';

// ===========================================
// リアルタイム文字数カウント機能
// ===========================================

/**
 * テキストエリアに入力があるたびに文字数をカウントし、表示を更新する
 */
function updateCharCount() {
    const currentLength = motivationTextInput.value.length;
    
    // 文字数表示を更新
    charCountDisplay.textContent = `文字数：${currentLength}`;
    
    // 400字を制限として設定し、超えたら警告を出す（応用機能）
    if (currentLength > 400) {
        charCountDisplay.style.color = 'red';
        charCountDisplay.textContent += ' (⚠️ 400字を超えています)';
    } else {
        charCountDisplay.style.color = 'initial'; // 通常の色に戻す
    }
}

// 志望動機入力欄に 'input' イベントリスナーを設定
motivationTextInput.addEventListener('input', updateCharCount);


// ===========================================
// データの取得・保存機能
// ===========================================

/**
 * ローカルストレージからデータを取得する
 * @returns {Array} 保存されている志望動機の配列。データがない場合は空の配列を返す。
 */
function getDrafts() {
    const draftsJson = localStorage.getItem(STORAGE_KEY);
    // JSON文字列をJavaScriptのオブジェクト（配列）に戻して返す
    return draftsJson ? JSON.parse(draftsJson) : [];
}

/**
 * データをローカルストレージに保存する
 * @param {Array} drafts - 保存する志望動機の配列
 */
function saveDrafts(drafts) {
    // JavaScriptのオブジェクト（配列）をJSON文字列に変換して保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

/**
 * 「保存」ボタンが押されたときの処理
 * @param {Event} event - イベントオブジェクト
 */
function handleSave(event) {
    event.preventDefault(); // フォームの送信によるページリロードを防ぐ
    
    const companyName = companyNameInput.value.trim();
    const motivationText = motivationTextInput.value.trim();
    
    // 入力が空でないかチェック
    if (!companyName || !motivationText) {
        alert('企業名と志望動機の両方を入力してください。');
        return;
    }
    
    // 新しい志望動機データを作成
    const newDraft = {
        id: Date.now(), // ユニークなIDとしてタイムスタンプを使用
        companyName: companyName,
        text: motivationText,
        savedAt: new Date().toLocaleString('ja-JP') // 保存日時
    };
    
    // 既存のデータを取得し、新しいデータを追加
    const drafts = getDrafts();
    drafts.unshift(newDraft); // 配列の先頭に追加
    
    // データを保存
    saveDrafts(drafts);
    
    // 画面表示を更新し、フォームをリセット
    renderDrafts();
    companyNameInput.value = '';
    motivationTextInput.value = '';
    updateCharCount(); // 文字数表示もリセット
    
    alert(`「${companyName}」の志望動機を保存しました！`);
}

// フォームの submit イベントに保存処理を設定
saveButton.closest('form').addEventListener('submit', handleSave);


// ===========================================
// 🌟 保存済みリストの表示機能
// ===========================================

/**
 * 指定されたIDの志望動機を削除する
 * @param {number} id - 削除するデータのID
 */
function deleteDraft(id) {
    if (!confirm('本当にこの下書きを削除しますか？')) {
        return;
    }

    let drafts = getDrafts();
    // 削除対象ID以外のデータで新しい配列を作成
    drafts = drafts.filter(draft => draft.id !== id);
    
    // データを保存し、画面表示を更新
    saveDrafts(drafts);
    renderDrafts();
}

/**
 * 保存されている全ての志望動機を画面に表示する
 */
function renderDrafts() {
    const drafts = getDrafts();
    
    // リストコンテナを一度空にする
    savedListContainer.innerHTML = ''; 
    
    if (drafts.length === 0) {
        savedListContainer.innerHTML = '<p>まだ保存された志望動機はありません。</p>';
        return;
    }

    // データの数だけHTML要素を作成し、コンテナに追加
    drafts.forEach(draft => {
        // 🌟 志望動機一つの表示要素を作成
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('entry');
        
        // 企業名と保存日時
        entryDiv.innerHTML = `
            <h3>${draft.companyName}</h3>
            <p><strong>保存日時:</strong> ${draft.savedAt}</p>
            <p>${draft.text.replace(/\n/g, '<br>')}</p>
            <button class="delete-button" data-id="${draft.id}">削除</button>
        `;
        
        // 削除ボタンにイベントリスナーを追加
        const deleteBtn = entryDiv.querySelector('.delete-button');
        deleteBtn.addEventListener('click', () => deleteDraft(draft.id));

        // リストコンテナに追加
        savedListContainer.appendChild(entryDiv);
    });
}

/**
 * 編集機能の追加 
 * @param {number} id - 編集するデータのID
 * @returns {void}
 * 
 */
function editDraft(id) {
    const drafts = getDrafts();
    const draftToEdit = drafts.find(draft => draft.id === id);


// ===========================================
// 🌟 アプリケーションの初期化
// ===========================================

// ブラウザがロードされたら、保存済みのデータを表示する
document.addEventListener('DOMContentLoaded', renderDrafts);