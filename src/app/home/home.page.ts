import { Component } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons, IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption } from '@ionic/angular/standalone';
import { Task } from './task';
import { initializeApp } from "firebase/app";
import { DocumentData, CollectionReference, collection, getDocs, getFirestore } from "firebase/firestore/lite";
import { getDatabase, onValue, ref, push, set, remove, onChildAdded, onChildChanged, onChildRemoved } from "firebase/database";
import { Title } from '@angular/platform-browser';

const firebaseConfig = {
  apiKey: "AIzaSyBrhMqfEO9dyK9Q5uoCmIl0AcD9JaSlkBw",
  authDomain: "ionictodolist-bcd8f.firebaseapp.com",
  databaseURL: "https://ionictodolist-bcd8f-default-rtdb.firebaseio.com",
  projectId: "ionictodolist-bcd8f",
  storageBucket: "ionictodolist-bcd8f.appspot.com",
  messagingSenderId: "680852941496",
  appId: "1:680852941496:web:78d215df307bc2e9d1a24d"
};

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

  constructor() {
    this.taskList = ref(this.db, 'tasks');

    onChildAdded(this.taskList, (data) => {
      this.tasks.push( { id: data.key, title: data.val().title, status: data.val().status } );
    });

    onChildChanged(this.taskList, (data) => {
      const task = { id: data.key, title: data.val().title, status: data.val().status };
      let index = this.tasks.indexOf(task);
      if (index > -1) {
        this.tasks.splice(index, 1);
      }
    });

    onChildRemoved(this.taskList, (data) => {
      const task = { id: data.key, title: data.val().title, status: data.val().status };
      let index = this.tasks.indexOf(task);
      if (index > -1) {
        this.tasks.splice(index, 1);
      }
    });

    onValue(this.taskList, (data) => {
      const misdatos = data.val();
      console.log(misdatos);
      console.log(JSON.stringify(misdatos));
      if (typeof(misdatos) != 'undefined') {
        misdatos.forEach( (element: Task) => {
          this.tasks.push( { id: element.id, title: element.title, status: element.status } );
        })
      }
    });
  }

  async getTasks(taskCol: CollectionReference) {
    const taskSnapshot = await getDocs(taskCol);
    const tasksData: DocumentData[] = taskSnapshot.docs.map( doc => doc.data() );
    tasksData.forEach(data => {
      console.log(data);
    });
  }

  addItem() {
    let theNewTask: string|null;
    theNewTask = prompt("New Task", '');
    if (theNewTask !== '' && theNewTask != null) {
      const taskCol = ref(this.db, 'tasks');
      const newTask = push(taskCol);
      set(newTask, {
        id: newTask.key,
        title: theNewTask,
        status: 'open'
      });
    }
  }

  deleteItem() {
    const confirmDelete = confirm("¿Estás seguro de que deseas eliminar este ítem?");
    if (confirmDelete) {
      const taskIndex = this.tasks.length - 1; // Supongamos que queremos eliminar el último elemento de la lista
      if (taskIndex >= 0) {
        const taskId = this.tasks[taskIndex].id;
        const taskRef = ref(this.db, 'tasks/' + taskId);
        remove(taskRef)
          .then(() => {
            // Eliminamos el elemento localmente
            this.tasks.splice(taskIndex, 1);
          })
          .catch((error) => {
            console.error("Error al eliminar el ítem:", error);
          });
      } else {
        alert("No hay elementos para eliminar.");
      }
    }
  }

  trackItems(index: number, itemObject: any) {
    return itemObject.title;
  }

  markAsDone(itemSliding: IonItemSliding, task: Task) {
    task.status = 'done';
    setTimeout( () => { itemSliding.close() }, 1 );
  }

  removeTask(itemSliding: IonItemSliding, task: Task) {
    let index = this.tasks.indexOf(task);
    if (index > -1) {
      this.tasks.splice(index, 1);
    }
    setTimeout( () => { itemSliding.close() }, 1 );
  }

}