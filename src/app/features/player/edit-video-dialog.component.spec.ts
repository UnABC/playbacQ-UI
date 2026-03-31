import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EditVideoDialogComponent, EditVideoDialogData } from './edit-video-dialog.component';

describe('EditVideoDialogComponent', () => {
  let component: EditVideoDialogComponent;
  let fixture: ComponentFixture<EditVideoDialogComponent>;
  const mockDialogRef = {
    close: vi.fn(),
  };
  const mockData: EditVideoDialogData = {
    title: 'Test Video',
    description: 'This is a test video description.',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditVideoDialogComponent],
      providers: [
        FormBuilder,
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditVideoDialogComponent);
    component = fixture.componentInstance;
    mockDialogRef.close.mockClear();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with provided data', () => {
    expect(component.videoForm.value).toEqual({
      title: mockData.title,
      description: mockData.description,
    });
  });

  it('should close dialog with updated data on save', () => {
    component.save();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      title: mockData.title,
      description: mockData.description,
    });
  });
  it('should not save if form is invalid', () => {
    const titleControl = component.videoForm.get('title');
    titleControl?.setValue('');
    component.videoForm.updateValueAndValidity();
    fixture.detectChanges();
    component.save();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });
});
