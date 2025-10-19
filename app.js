// 1. HTML要素の取得
// JavaScriptで操作したい要素をIDを使って取得します
const companyNameInput = document.getElementById('companyName');
const motivationTextInput = document.getElementById('motivationText');
const saveButton = document.getElementById('saveButton');
const charCountDisplay = document.getElementById('charCount');
const savedListContainer = document.getElementById('savedList');
const addSectionButton = document.getElementById('addSectionButton');
// ローカルストレージで使用するキー名
const STORAGE_KEY = 'esDrafts';

//編集中データ ID（編集機能用、未実装）
let editingID = null;

// ===========================================
// リアルタイム文字数カウント機能
// ===========================================
/**
 * テキストエリアに入力があるたびに文字数をカウントし、表示を更新する
 * @param {Event} event - inputイベントオブジェクト
 */
function updateCharCount(event) {
    const textarea = event.target;;
    const currentLength = textarea.value.length;

    //自動高さ調整
    textarea.style.height = `auto`;
    textarea.style.height = (textarea.scrollHeight) + `px`;
    
    //カウント表示要素を取得
    const charCountDisplay = textarea.nextElementSibling;
    
    // 文字数表示を更新
    charCountDisplay.textContent = `文字数：${currentLength}`;

    if(!charCountDisplay) return; //表示要素がない場合は終了
     
    // 400字を制限として設定し、超えたら警告を出す（応用機能）
    if (currentLength > 400) {
        charCountDisplay.style.color = 'red';
        charCountDisplay.textContent += ' (⚠️ 400字を超えています)';
    } else {
        charCountDisplay.style.color = 'initial'; // 通常の色に戻す
    }
}

// テキストエリアの input イベントに文字数カウント機能を設定
motivationTextInput.addEventListener('input', updateCharCount);

/**
 * フォームをデフォルトの状態に戻す
 */
function resetForm() {
    companyNameInput.value = '';
    motivationTextInput.value = '';
    
    //メインの文字数表示のリセット
    if(charCountDisplay) {
        charCountDisplay.textContent = `文字数：0`;
        charCountDisplay.style.color = 'initial'; // 通常の色に戻す
    }

    //編集モードの解除
    editingID = null;
    saveButton.textContent = `保存`; // ボタン表示を元に戻す

    //追加項目のクリア
    const additionalSectionsContainer = document.getElementById(`additionalSections`);
    additionalSectionsContainer.innerHTML = ``;
}

/**
 * テキストエリアの初期高さを内容に合わせて調整する．
 * @param {HTMLTextAreaElement} textarea - 高さを調整するテキストエリア要素
 */
function autoresizeTextarea(textarea) {
    if(textarea) {
        textarea.style.height = `auto`;
        textarea.style.height = (textarea.scrollHeight) + `px`;
    }
}

// ===========================================
// データの取得機能
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


// ===========================================
// データの保存機能
// ===========================================
/**
 * データをローカルストレージに保存する
 * @param {Array} drafts - 保存する志望動機の配列
 */
function saveDrafts(drafts) {
    // JavaScriptのオブジェクト（配列）をJSON文字列に変換して保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

/*
// ===========================================
// 質問項目の追加機能
// ===========================================

/**
 * 質問項目を追加する
 */
// app.js の addSection 関数 (修正後)

function addSection() {
    const container = document.getElementById('additionalSections');
    const sectionIndex = container.children.length; 
    const questionNumber = sectionIndex + 1;

    const div = document.createElement('div');
    div.classList.add(`question-section`);
    div.innerHTML = 
    ` <hr>
        <label for="question${questionNumber}">質問 ${questionNumber}：</label>
        <textarea id="question${questionNumber}" name="question${questionNumber}" placeholder="質問を入力" required></textarea>
        
        <p class="char-count-display question-char-count">文字数：0</p> 

        <label for="answer${questionNumber}">回答：</label>
        <textarea id="answer${questionNumber}" name="answer${questionNumber}" placeholder="回答を入力" required></textarea>
        
        <p class="char-count-display answer-char-count">文字数：0</p>
        <div><button type="button" class="remove-btn">削除</button></div>
    `;

    // 🌟 質問（textarea）へのイベントリスナー設定と高さ調整 🌟
    const questionTextarea = div.querySelector(`#question${questionNumber}`);
    if(questionTextarea) {
        questionTextarea.addEventListener(`input`, updateCharCount);
        autoresizeTextarea(questionTextarea);
    }

    // 🌟 回答（textarea）へのイベントリスナー設定と高さ調整 🌟
    const answerTextarea = div.querySelector(`#answer${questionNumber}`);
    if(answerTextarea) {
        answerTextarea.addEventListener('input', updateCharCount);
        autoresizeTextarea(answerTextarea);
    }
    
    // 削除ボタンをクリックしたら、その親要素（div.question-section）を削除する
    div.querySelector('.remove-btn').addEventListener('click', () => {
        container.removeChild(div);
    });
    
    // コンテナに新しい質問項目を追加
    container.appendChild(div);
}

/**
 * 「保存」ボタンが押されたときの処理
 * @param {Event} event - イベントオブジェクト
 */
function handleSave(event) {

    event.preventDefault(); // フォームの送信によるページリロードを防ぐ
    
    const companyName = document.getElementById('companyName').value;
    const motivationText = document.getElementById('motivationText').value;

    if (!companyName || !motivationText) {
        alert('企業名と志望動機の両方を入力してください。');
        return;
    }

    //追加質問項目のデータを取得
    const additionalQuestions = getAdditionalQuestionData();
    
    let existingData = getDrafts();
    let alertMessage = '';

    //編集モードのロジック
    if(editingID != null) {
        //既存データを検索し、該当するIDのデータを更新
        existingData = existingData.map(draft => {
            if(draft.id === editingID) {
                return {
                    ...draft, //既存データを展開
                    companyName: companyName,
                    //志望動機の内容を更新
                    motivationText: motivationText,
                    additionalQuestions: additionalQuestions,
                    savedAt: new Date().toLocaleString('ja-JP') // 更新日時をセット
                };
            }
            return draft; //他のデータはそのまま返す
        });
        alertMessage = `「${companyName}」の志望動機を更新しました！`;

        //編集モード終了
        editingID = null;
        saveButton.textContent = `保存`; // ボタン表示を元に戻す
    }
    //新規保存モードのロジック
    else {
        const new_data = {
            id: Date.now(), // ユニークなIDとしてタイムスタンプを使用
            companyName: companyName,
            motivationText: motivationText,
            savedAt: new Date().toLocaleString('ja-JP') // 保存日時
        };

        //新しいデータを配列の先頭に追加
        existingData.unshift(new_data);
        alertMessage = `「${companyName}」の志望動機を保存しました！`;
    }
    //まとめて保存
    saveDrafts(existingData);
    //フォームをリセット
    resetForm();

    //表示の更新
    renderDrafts();

    alert(alertMessage);
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
    let Array_drafts = [];


    console.log("drafts:", drafts, "typeof drafts:", typeof drafts);
    console.log("Array.isArray(drafts):", Array.isArray(drafts));
    
    // リストコンテナを一度空にする
    savedListContainer.innerHTML = ''; 
    
    if (drafts.length === 0) {
        savedListContainer.innerHTML = '<p>まだ保存された志望動機はありません。</p>';
        return;
    }

    //draftsが配列でない場合の対処
    if(!Array.isArray(drafts)) {
        Array_drafts = [drafts]; // 配列に変換
    }
    console.log("Array.isArray(drafts):", Array.isArray(drafts));
    
    // データの数だけHTML要素を作成し、コンテナに追加
    drafts.forEach(draft => {
        // 🌟 志望動機一つの表示要素を作成
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('entry');

        // 追加質問の表示
        const additionalHtml = formattedAdditionalQuestions(draft.additionalQuestions);
        
        // 企業名と保存日時
        entryDiv.innerHTML = `
            <h3>${draft.companyName}</h3>
            <p><strong>保存日時:</strong> ${draft.savedAt}${draft.updatedAt ? ` (更新日時: ${draft.updatedAt})` : ''}</p>
            
            <h4>【志望動機】</h4>
            <p style="white-space: pre-wrap;">${draft.motivationText.replace(/\n/g, '<br>')}</p>
            
            ${additionalHtml} <button class="delete-button" data-id="${draft.id}">削除</button>
        `;


        // 削除ボタンにイベントリスナーを追加
        const deleteBtn = entryDiv.querySelector('.delete-button');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // クリックイベントのバブリングを防止
            deleteDraft(draft.id);
        });

        // リストコンテナに追加
        savedListContainer.appendChild(entryDiv);

    //編集：項目をクリックしたら編集を開始。
    entryDiv.addEventListener(`click`, () => startEdit(draft)); 
    });
}



/**
 * 編集機能の追加 
 * @param {Object} draft - 編集するデータ
 * 
 **/
 
function startEdit(draft) {
    //フォームのリセット
    resetForm();

    //1 . 編集中のIDをセット
    editingID = draft.id;

    //2 .フォームにデータをロード
    companyNameInput.value = draft.companyName;
    motivationTextInput.value = draft.motivationText;

    //メインの志望動機欄の高さを調整
    autoresizeTextarea(motivationTextInput);

    //追加質問項目の復元
    if(draft.additionalQuestions && Array.isArray(draft.additionalQuestions)) {
        restoreAdditionalQuestions(draft.additionalQuestions);
    }
    //3 . ボタンの表示を「編集モード」に変更
    saveButton.textContent = `更新`;

    // 4. フォーム上部に移動
    window.scrollTo({ top: 0, behavior: `smooth`});
}

/**
 * フォームから追加の質問項目のデータを取得する
 * @returns {Array<Object>} 質問と回答のペアの配列
 */
// app.js の getAdditionalQuestionData 関数 (修正後)

function getAdditionalQuestionData() {
    const questionsContainer = document.getElementById('additionalSections');
    const questionSections = questionsContainer.querySelectorAll('.question-section');
    const data = [];

    questionSections.forEach(section => {
        // 🚨 修正: 最初の二つの textarea を質問と回答として取得
        const allTextareas = section.querySelectorAll('textarea');

        const questionTextarea = allTextareas[0]; // 質問の textarea
        const answerTextarea = allTextareas[1];   // 回答の textarea

        if (questionTextarea && answerTextarea) {
            data.push({
                question: questionTextarea.value, // 🌟 questionTextarea の値を参照 🌟
                answer: answerTextarea.value
            });
        }
    });

    return data;
}

/**
 * 追加質問の配列をリスト表示用のHTML文字列に変換する。
 * @param {Array<Object>} questions - 質問と回答のペアの配列
 * @returns {string} HTML文字列
 */
function formattedAdditionalQuestions(questions) {
    if(!questions || questions.length === 0) {
        return '';
    }

    let html = `<div class= "additional-questions">`;
    questions.forEach((item, index) => {
        //質問と回答の内容の改行を<br>に変換
        const formattedQuestions = item.question.replace(/\n/g, '<br>');
        const formattedAnswer = item.answer.replace(/\n/g, '<br>');

        html += `
            <div class="question-summary" style="margin-top: 15px; padding-left: 10px; border-left: 3px solid #ccc;">
                <h4>質問 ${index + 1}：</h4>
                <p style="white-space: pre-wrap;">${formattedQuestions}</p>
                <h4>回答：</h4>
                <p style="white-space: pre-wrap;">${formattedAnswer}</p>
            </div>
        `;
    });
    html += `</div>`;
    return html; 
}

/**
 * 保存されたデータから追加の質問項目をフォームに復元する
 * @param {Array<Object>} questions - 質問と回答のペアの配列
 */
// app.js の restoreAdditionalQuestions 関数 (修正後)

function restoreAdditionalQuestions(questions) {
    questions.forEach(item => {
        const container = document.getElementById('additionalSections');
        const sectionIndex = container.children.length; 
        const questionNumber = sectionIndex + 1;

        const div = document.createElement('div');
        div.classList.add(`question-section`);
        div.innerHTML = 
        ` <hr>
            <label for="question${questionNumber}">質問 ${questionNumber}：</label>
            <textarea id="question${questionNumber}" name="question${questionNumber}" placeholder="質問を入力" required>${item.question}</textarea>
            
            <p class="char-count-display question-char-count">文字数：${item.question.length}</p>

            <label for="answer${questionNumber}">回答：</label>
            <textarea id="answer${questionNumber}" name="answer${questionNumber}" placeholder="回答を入力" required>${item.answer}</textarea>
            
            <p class="char-count-display answer-char-count">文字数：${item.answer.length}</p>
            <button type="button" class="remove-btn">削除</button>
        `;

        // 🌟 質問（textarea）へのイベントリスナー設定と高さ調整 🌟
        const questionTextarea = div.querySelector(`#question${questionNumber}`);
        if(questionTextarea) {
            questionTextarea.addEventListener(`input`, updateCharCount);
            autoresizeTextarea(questionTextarea);
        }

        // 🌟 回答（textarea）へのイベントリスナー設定と高さ調整 🌟
        const answerTextarea = div.querySelector(`#answer${questionNumber}`);
        if(answerTextarea) {
            answerTextarea.addEventListener('input', updateCharCount);
            autoresizeTextarea(answerTextarea);
        }
        
        // 削除機能のリスナーを再設定
        div.querySelector('.remove-btn').addEventListener('click', () => {
            container.removeChild(div);
        });
        
        container.appendChild(div);
    });
}

// 「質問項目を追加」ボタンにイベントリスナーを設定
// 質問項目追加ボタンにイベントリスナーを設定 (DOMContentLoadedの外)
addSectionButton.addEventListener('click', addSection);

// ===========================================
// 🌟 アプリケーションの初期化
// ===========================================

// ブラウザがロードされたら、保存済みのデータを表示する
document.addEventListener('DOMContentLoaded', renderDrafts);