import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 対象がバックエンドAPIの場合のみ処理する
  const isApiUrl = req.url.startsWith('https://playbacq.trap.show') || req.url.startsWith('/api');
  const isEmbedApiUrl =
    req.url.startsWith('https://playbacq.trap.show/unauthApi') || req.url.startsWith('/unauthApi');
  if (isApiUrl && !isEmbedApiUrl) {
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
          window.location.href = `https://playbacq.trap.show/api/auth/login?redirect=${redirectUrl}`;
        }
        return throwError(() => error);
      }),
    );
  }

  return next(req);
};
