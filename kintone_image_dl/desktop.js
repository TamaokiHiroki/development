(function(PLUGIN_ID) {
  'use strict';

  const CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);
  
  // プラグイン設定画面のボタンイベント
  kintone.events.on('app.plugin.config.show', function(event) {
    // 設定画面はconfig.htmlで処理
    return event;
  });

  // アプリのレコード一覧画面にボタンを追加
  kintone.events.on('app.record.index.show', function(event) {
    if (document.getElementById('kintone-image-dl-button')) {
      return event;
    }

    const headerSpace = kintone.app.getHeaderSpaceElement();
    if (!headerSpace) {
      return event;
    }

    const button = document.createElement('button');
    button.id = 'kintone-image-dl-button';
    button.textContent = '画像一括ダウンロード';
    button.className = 'kintoneplugin-button-dialog-ok';
    button.style.cssText = 'margin-left: 10px; padding: 8px 16px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;';
    
    button.addEventListener('click', async () => {
      await showDownloadDialog();
    });

    headerSpace.appendChild(button);
    return event;
  });

  // ダウンロードダイアログを表示
  async function showDownloadDialog() {
    const dialog = new kintone.Plugin.Dialog({
      title: '画像一括ダウンロード',
      width: 650,
      height: 450,
      showCloseButton: true
    });

    // ダイアログのコンテンツを作成
    const content = document.createElement('div');
    content.style.cssText = 'padding: 20px;';
    
    // デフォルトで今日の日付を設定
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const startDateInput = document.createElement('input');
    startDateInput.type = 'date';
    startDateInput.id = 'dl-start-date';
    startDateInput.value = oneMonthAgo.toISOString().split('T')[0];
    startDateInput.style.cssText = 'width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;';

    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.id = 'dl-end-date';
    endDateInput.value = today.toISOString().split('T')[0];
    endDateInput.style.cssText = 'width: 100%; padding: 10px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;';

    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = 'background-color: #e8f4f8; border-left: 4px solid #3498db; padding: 12px; margin-bottom: 20px; border-radius: 4px; font-size: 14px; color: #555;';
    infoDiv.textContent = 'レコードの作成期間を指定して、その期間内に作成されたレコードに含まれる画像を一括でダウンロードできます。';

    const buttonDiv = document.createElement('div');
    buttonDiv.style.cssText = 'display: flex; gap: 10px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.className = 'kintoneplugin-button-dialog-cancel';
    cancelBtn.style.cssText = 'flex: 1; padding: 10px;';
    cancelBtn.addEventListener('click', () => dialog.hide());

    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = 'ダウンロード開始';
    downloadBtn.className = 'kintoneplugin-button-dialog-ok';
    downloadBtn.style.cssText = 'flex: 1; padding: 10px;';
    downloadBtn.addEventListener('click', async () => {
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;

      if (!startDate || !endDate) {
        alert('開始日と終了日を入力してください。');
        return;
      }

      if (new Date(startDate) > new Date(endDate)) {
        alert('開始日は終了日より前の日付を指定してください。');
        return;
      }

      dialog.hide();
      await startDownload({ startDate, endDate });
    });

    content.appendChild(infoDiv);
    content.appendChild(document.createTextNode('開始日'));
    content.appendChild(startDateInput);
    content.appendChild(document.createTextNode('終了日'));
    content.appendChild(endDateInput);
    buttonDiv.appendChild(cancelBtn);
    buttonDiv.appendChild(downloadBtn);
    content.appendChild(buttonDiv);

    dialog.setContent(content);
    dialog.show();
  }

  // ダウンロード処理を開始
  async function startDownload(config) {
    const { startDate, endDate } = config;
    
    // プログレス表示
    const progressDialog = new kintone.Plugin.Dialog({
      title: '画像ダウンロード中',
      width: 400,
      height: 200,
      showCloseButton: false
    });

    const progressContent = document.createElement('div');
    progressContent.style.cssText = 'padding: 20px; text-align: center;';
    progressContent.innerHTML = `
      <div id="progress-text">レコードを取得中...</div>
      <div id="progress-details" style="margin-top: 10px; color: #666; font-size: 12px;"></div>
    `;
    progressDialog.setContent(progressContent);
    progressDialog.show();

    try {
      // レコードを取得
      const records = await fetchRecordsByDateRange(startDate, endDate, (progress) => {
        document.getElementById('progress-text').textContent = progress.message;
        if (progress.details) {
          document.getElementById('progress-details').textContent = progress.details;
        }
      });

      if (records.length === 0) {
        progressDialog.hide();
        alert('指定期間内にレコードが見つかりませんでした。');
        return;
      }

      // 画像を収集
      document.getElementById('progress-text').textContent = '画像を収集中...';
      const images = collectImages(records);
      
      if (images.length === 0) {
        progressDialog.hide();
        alert('画像が見つかりませんでした。');
        return;
      }

      // 画像をダウンロード
      document.getElementById('progress-text').textContent = `画像をダウンロード中... (${images.length}件)`;
      await downloadImages(images, startDate, endDate, (progress) => {
        document.getElementById('progress-text').textContent = progress.message;
        if (progress.details) {
          document.getElementById('progress-details').textContent = progress.details;
        }
      });

      progressDialog.hide();
      alert(`ダウンロードが完了しました。\n${images.length}件の画像をダウンロードしました。`);
    } catch (error) {
      progressDialog.hide();
      alert('エラーが発生しました: ' + error.message);
      console.error(error);
    }
  }

  // 指定期間内のレコードを取得
  async function fetchRecordsByDateRange(startDate, endDate, progressCallback) {
    const allRecords = [];
    let offset = 0;
    const limit = 500;
    let hasMore = true;

    // 日付範囲のクエリを作成
    const query = `作成日時 >= "${startDate}T00:00:00Z" and 作成日時 <= "${endDate}T23:59:59Z" order by レコード番号 asc limit ${limit}`;

    while (hasMore) {
      if (progressCallback) {
        progressCallback({
          message: `レコードを取得中... (${allRecords.length}件取得済み)`,
          details: `オフセット: ${offset}`
        });
      }

      try {
        const response = await kintone.api('/k/v1/records', 'GET', {
          app: kintone.app.getId(),
          query: query + ` offset ${offset}`,
          totalCount: true
        });

        if (response.records && response.records.length > 0) {
          allRecords.push(...response.records);
          offset += limit;
          hasMore = response.records.length === limit;
        } else {
          hasMore = false;
        }
      } catch (error) {
        // クエリが失敗した場合、より単純なクエリを試す
        try {
          const simpleQuery = `作成日時 >= "${startDate}T00:00:00Z" and 作成日時 <= "${endDate}T23:59:59Z" limit ${limit} offset ${offset}`;
          const response = await kintone.api('/k/v1/records', 'GET', {
            app: kintone.app.getId(),
            query: simpleQuery
          });

          if (response.records && response.records.length > 0) {
            allRecords.push(...response.records);
            offset += limit;
            hasMore = response.records.length === limit;
          } else {
            hasMore = false;
          }
        } catch (e) {
          throw new Error('レコードの取得に失敗しました: ' + e.message);
        }
      }
    }

    return allRecords;
  }

  // レコードから画像を収集
  function collectImages(records) {
    const images = [];
    const appFields = kintone.app.getFields();

    records.forEach((record) => {
      // レコード番号を取得
      let recordNumber = 'N/A';
      if (record.$id && record.$id.value) {
        recordNumber = record.$id.value;
      }
      
      Object.keys(record).forEach((fieldCode) => {
        const field = appFields[fieldCode];
        if (!field) return;

        // 画像フィールドを検出
        if (field.type === 'FILE') {
          const fileField = record[fieldCode];
          if (fileField && fileField.value && fileField.value.length > 0) {
            fileField.value.forEach((file) => {
              images.push({
                recordId: record.$id ? record.$id.value : null,
                recordNumber: recordNumber,
                fieldCode: fieldCode,
                fieldName: field.label || fieldCode,
                fileKey: file.fileKey,
                name: file.name,
                contentType: file.contentType
              });
            });
          }
        }
      });
    });

    return images;
  }

  // 画像をダウンロード
  async function downloadImages(images, startDate, endDate, progressCallback) {
    const JSZip = window.JSZip || await loadJSZip();
    const zip = new JSZip();

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      if (progressCallback) {
        progressCallback({
          message: `画像をダウンロード中... (${i + 1}/${images.length})`,
          details: image.name
        });
      }

      try {
        // ファイルを取得（fetch APIを使用）
        const fileUrl = `/k/v1/file.json?fileKey=${encodeURIComponent(image.fileKey)}`;
        const response = await fetch(fileUrl, {
          method: 'GET',
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        
        // ファイル名をサニタイズ（特殊文字を削除）
        const sanitizedFieldName = sanitizeFileName(image.fieldName);
        const sanitizedFileName = sanitizeFileName(image.name);
        const folderPath = `${sanitizedFieldName}/${image.recordNumber}_${sanitizedFileName}`;
        
        zip.file(folderPath, blob);
      } catch (error) {
        console.error(`画像のダウンロードに失敗しました: ${image.name}`, error);
        // エラーが発生しても続行
      }
    }

    // ZIPファイルを生成してダウンロード
    if (progressCallback) {
      progressCallback({
        message: 'ZIPファイルを生成中...',
        details: ''
      });
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kintone_images_${startDate}_${endDate}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ファイル名をサニタイズ（特殊文字を削除）
  function sanitizeFileName(fileName) {
    // Windows/Linux/Macで使用できない文字を削除または置換
    return fileName
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 200); // 長すぎるファイル名を切り詰め
  }

  // JSZipライブラリを読み込む
  function loadJSZip() {
    return new Promise((resolve, reject) => {
      if (window.JSZip) {
        resolve(window.JSZip);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = () => {
        if (window.JSZip) {
          resolve(window.JSZip);
        } else {
          reject(new Error('JSZipライブラリの読み込みに失敗しました'));
        }
      };
      script.onerror = () => {
        reject(new Error('JSZipライブラリの読み込みに失敗しました'));
      };
      document.head.appendChild(script);
    });
  }

})(kintone.$PLUGIN_ID);

