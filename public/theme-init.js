// ダークモード・フォント初期化（チラつき防止のため同期実行）
// React が動き出す前にページ描画の瞬間に実行される
(function() {
  if (localStorage.getItem('jimitas_dark') === 'true') {
    document.documentElement.classList.add('dark');
  }
  var font = localStorage.getItem('jimitas_font');
  if (font === 'gothic') {
    document.documentElement.dataset.font = 'gothic';
  }
})();
