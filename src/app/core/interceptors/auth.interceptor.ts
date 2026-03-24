import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 対象がバックエンドAPIの場合のみ処理する
  const isApiUrl =
    req.url.startsWith('https://playbacq-backend.trap.show') || req.url.startsWith('/api');

  if (isApiUrl) {
    // プロキシのセッションCookieをクロスドメインで送信する設定
    const clonedReq = req.clone({
      withCredentials: true,
    });
    return next(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // 認証エラーのハンドリング
        if (error.status === 401 || error.status === 0) {
          console.warn('認証セッションがありません。ログインが必要です。');
          // PaaSプロキシにOAuthの画面遷移を処理させる。
          const redirectUrl = encodeURIComponent(window.location.href);
          window.location.href = `https://playbacq-backend.trap.show/api/videos?redirect=${redirectUrl}`;
        }
        return throwError(() => error);
      }),
    );
  }

  return next(req);
};
