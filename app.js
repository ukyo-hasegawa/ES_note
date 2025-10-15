// 1. HTML要素の取得
// JavaScriptで操作したい要素をIDを使って取得します
const companyNameInput = document.getElementById('companyName');
const motivationTextInput = document.getElementById('motivationText');
const saveButton = document.getElementById('saveButton');
const charCountDisplay = document.getElementById('charCount');
const savedListContainer = document.getElementById('savedList');

// ローカルストレージで使用するキー名
const STORAGE_KEY = 'esDrafts';

//編集中データ ID（編集機能用、未実装）
let editingID = null;

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

// ===========================================
// 質問項目の追加機能
// ===========================================

/**
 * 質問項目を追加する
 */
function addQuestionSection() {
    const questionIndex = document.getElementById('additionalSections');
    const sectionIndex = questionIndex.children.length; //additionalSectionsの子要素数を取得して意味あるのか？
    const div = document.createElement('div');
    div.classList.add(`question-section`);
    div.innerHTML = 
    ` <hr>
        <label for="q&(sectionIndex)">質問 ${sectionIndex + 1}：</label>
        <input type="text" id="q${sectionIndex}" name="question${sectionIndex}" placeholder="質問を入力"> required>
        <label for="a${sectionIndex}">回答：</label>
        <textarea id="a${sectionIndex}" name="answer${sectionIndex}" placeholder="回答を入力" required></textarea>
        <button type="button" class="remove-btn">削除</button>
        `;
    //削除ボタン機能をつける
    div.querySelector('.remove-btn').addEventListener('click', () => {
        conteainer.removeChild(div);
    });
    
    container.appendChild(div);
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

    let drafts = getDrafts();
    let alertMessage = '';

    if (editingID != null) {
        
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

    //編集：項目をクリックしたら編集を開始。
    entryDiv.addEventListener(`click`, () => startEdit(draft)); 
}

/**
 * 編集機能の追加 
 * @param {Object} draft - 編集するデータ
 * 
 **/
 
function startEdit(draft) {
    //1 . 編集中のIDをセット
    editingID = draft.id;

    //2 .フォームにデータをロード
    companyNameInput.value = draft.companyName;
    motivationTextInput.value = draft.text;

    //3 . 文字数表示を更新
    updateCharCount(); 

    //4 . ボタンの表示を「編集モード」に変更
    saveButton.textContent = `更新`;

}
    const drafts = getDrafts();
    const draftToEdit = drafts.find(draft => draft.id === id);

    // 編集対象のデータが見つからない場合は終了
    if (!draftToEdit) {
        alert('編集対象の下書きが見つかりません。');
        return;
    }

    // フォームにデータをセット
    companyNameInput.value = draftToEdit.companyName;
    motivationTextInput.value = draftToEdit.text;
    updateCharCount(); // 文字数表示を更新
}



// ===========================================
// 🌟 アプリケーションの初期化
// ===========================================

// ブラウザがロードされたら、保存済みのデータを表示する
document.addEventListener('DOMContentLoaded', renderDrafts);