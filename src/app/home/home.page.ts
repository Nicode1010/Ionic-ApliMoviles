import { Component } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons, IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption, ModalController } from '@ionic/angular/standalone';
import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref, push, set, remove, onChildAdded, onChildChanged, onChildRemoved } from "firebase/database";
import { Task } from './task';
import { TaskModalComponent } from '../task-modal/task-modal.component';
import { firebaseConfig } from '../firebase.config';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [NgClass, IonItemOption, IonItemOptions, IonItemSliding, NgFor, IonLabel, IonItem, IonList, IonButtons, IonIcon, IonButton, IonHeader, IonToolbar, IonTitle, IonContent],
})
export class HomePage {
  taskList;
  tasks: Array<Task> = [];
  app = initializeApp(firebaseConfig);
  db = getDatabase(this.app);

  constructor(private modalController: ModalController) {
    this.taskList = ref(this.db, 'tasks');
    this.initializeTasks();
  }

  initializeTasks(): void {
    onChildAdded(this.taskList, (data) => {
      this.tasks.push({ id: data.key, title: data.val().title, status: data.val().status });
    });

    onChildChanged(this.taskList, (data) => {
      const updatedTask = { id: data.key, title: data.val().title, status: data.val().status };
      const index = this.tasks.findIndex(task => task.id === updatedTask.id);
      if (index !== -1) {
        this.tasks[index] = updatedTask;
      }
    });

    onChildRemoved(this.taskList, (data) => {
      const removedTask = { id: data.key, title: data.val().title, status: data.val().status };
      const index = this.tasks.findIndex(task => task.id === removedTask.id);
      if (index !== -1) {
        this.tasks.splice(index, 1);
      }
    });

    onValue(this.taskList, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.tasks = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      }
    });
  }

  async addItem(): Promise<void> {
    const modal = await this.modalController.create({
      component: TaskModalComponent
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        const taskCol = ref(this.db, 'tasks');
        const newTask = push(taskCol);
        set(newTask, {
          id: newTask.key,
          title: result.data.title,
          status: 'open'
        }).catch(error => {
          console.error("Error adding task:", error);
        });
      }
    });

    await modal.present();
  }

  deleteItem(): void {
    const confirmDelete = confirm("¿Estás seguro de que deseas eliminar este ítem?");
    if (confirmDelete) {
      const taskIndex = this.tasks.length - 1; // Supongamos que queremos eliminar el último elemento de la lista
      if (taskIndex >= 0) {
        const taskId = this.tasks[taskIndex].id;
        const taskRef = ref(this.db, 'tasks/' + taskId);
        remove(taskRef).then(() => {
          this.tasks.splice(taskIndex, 1);
        }).catch((error) => {
          console.error("Error deleting task:", error);
        });
      } else {
        alert("No hay elementos para eliminar.");
      }
    }
  }

  trackItems(index: number, itemObject: any): string {
    return itemObject.title;
  }

  markAsDone(itemSliding: IonItemSliding, task: Task): void {
    task.status = 'done';
    this.updateTaskStatus(task);
    setTimeout(() => { itemSliding.close() }, 1);
  }

  removeTask(itemSliding: IonItemSliding, task: Task): void {
    const index = this.tasks.indexOf(task);
    if (index > -1) {
      const taskRef = ref(this.db, 'tasks/' + task.id);
      remove(taskRef).then(() => {
        this.tasks.splice(index, 1);
      }).catch((error) => {
        console.error("Error removing task:", error);
      });
    }
    setTimeout(() => { itemSliding.close() }, 1);
  }

  private updateTaskStatus(task: Task): void {
    const taskRef = ref(this.db, 'tasks/' + task.id);
    set(taskRef, task).catch(error => {
      console.error("Error updating task status:", error);
    });
  }
}