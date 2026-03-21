import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let app: App;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    vi.useFakeTimers();
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('playbacQ');
  });
  // ダイアログのテスト
  it('should open upload dialog', async () => {
    const dialogSpy = vi.spyOn(app.dialog, 'open').mockReturnValue({
      afterClosed: () => of(),
    } as any);
    app.openUploadDialog();
    expect(dialogSpy).toHaveBeenCalled();
    expect(dialogSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        disableClose: true,
        autoFocus: false,
      }),
    );
  });
  // 検索のテスト
  it('should navigate with search query', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    app.onSearch('test keyword');
    expect(navigateSpy).toHaveBeenCalledWith(['/'], { queryParams: { search: 'test keyword' } });
  });
  it('should navigate without search query when keyword is empty', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    app.onSearch('   '); // 空白のみ
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });
  it('should alert when search keyword is too long', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    app.onSearch('a'.repeat(1025)); // 1025文字のキーワード
    expect(alertSpy).toHaveBeenCalledWith(
      'あり得ないことが起きています。HTMLを改竄していませんか？',
    );
  });
  // DOMのテスト
  it('should have search input and upload button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const searchInput = compiled.querySelector('input[type="text"]');
    const uploadButton = compiled.querySelector('button[mat-icon-button]');
    expect(searchInput).toBeTruthy();
    expect(uploadButton).toBeTruthy();
  });
  it('should call onSearch when enter key is pressed', () => {
    const searchInput = fixture.nativeElement.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement;
    const onSearchSpy = vi.spyOn(app, 'onSearch');
    searchInput.value = 'test';
    const searchInputDebug = fixture.debugElement.query(By.css('input[type="text"]'));
    searchInputDebug.triggerEventHandler('keyup.enter', {});
    expect(onSearchSpy).toHaveBeenCalledWith('test');
  });
  it('should call onSearch when search button is clicked', () => {
    const searchInput = fixture.nativeElement.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement;
    const onSearchSpy = vi.spyOn(app, 'onSearch');
    searchInput.value = 'test';
    const searchButtonDebug = fixture.debugElement.query(By.css('button[mat-icon-button]'));
    searchButtonDebug.triggerEventHandler('click', null);
    expect(onSearchSpy).toHaveBeenCalledWith('test');
  });
  it('should call openUploadDialog when upload button is clicked', () => {
    const openDialogSpy = vi.spyOn(app, 'openUploadDialog');
    const uploadButtonDebug = fixture.debugElement.query(By.css('button[mat-flat-button]'));
    uploadButtonDebug.triggerEventHandler('click', null);
    expect(openDialogSpy).toHaveBeenCalled();
  });
});
