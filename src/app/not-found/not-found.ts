import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div style="text-align: center; padding: 2rem;">
      <h2>404 - Không tìm thấy trang</h2>
      <p>Rất tiếc, đường dẫn hoặc món trà sữa bạn truy cập không tồn tại.</p>
      <a routerLink="/drinks">Quay về trang danh sách</a>
    </div>
  `,
})
export class NotFound {}
