package com.timerhythm.app.feature.tasks

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.ExitToApp
import androidx.compose.material.icons.rounded.PauseCircle
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material3.AssistChip
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.timerhythm.app.core.model.Task
import com.timerhythm.app.core.model.TaskStatus
import com.timerhythm.app.feature.auth.SessionUiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TasksScreen(
    sessionState: SessionUiState,
    tasksViewModel: TasksViewModel,
    onLogout: () -> Unit,
) {
    val state by tasksViewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(state.error) {
        state.error?.let { snackbarHostState.showSnackbar(it) }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("时律")
                        Text(
                            text = sessionState.user?.username ?: "",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Rounded.ExitToApp, contentDescription = "退出登录")
                    }
                },
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = tasksViewModel::showCreateSheet) {
                Icon(Icons.Rounded.Add, contentDescription = "创建任务")
            }
        },
    ) { innerPadding ->
        Box(
            modifier = androidx.compose.ui.Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.surfaceContainerLowest)
                .padding(innerPadding),
        ) {
            Column(modifier = androidx.compose.ui.Modifier.fillMaxSize()) {
                DateHeader(
                    selectedDate = state.selectedDate,
                    onPreviousDay = { tasksViewModel.shiftDate(-1) },
                    onNextDay = { tasksViewModel.shiftDate(1) },
                )

                if (state.isLoading) {
                    Box(
                        modifier = androidx.compose.ui.Modifier.fillMaxSize(),
                        contentAlignment = androidx.compose.ui.Alignment.Center,
                    ) {
                        CircularProgressIndicator()
                    }
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        if (state.tasks.isEmpty()) {
                            item {
                                EmptyStateCard()
                            }
                        }
                        items(state.tasks, key = Task::id) { task ->
                            TaskCard(
                                task = task,
                                onStart = { tasksViewModel.updateStatus(task, TaskStatus.Active) },
                                onDone = { tasksViewModel.updateStatus(task, TaskStatus.Done) },
                                onReset = { tasksViewModel.updateStatus(task, TaskStatus.Pending) },
                                onDelete = { tasksViewModel.deleteTask(task.id) },
                                onDecompose = { tasksViewModel.openDecompose(task) },
                            )
                        }
                    }
                }
            }

            if (state.isCreateSheetOpen) {
                ModalBottomSheet(onDismissRequest = tasksViewModel::hideCreateSheet) {
                    TaskEditorSheet(
                        draft = state.draft,
                        onDraftChanged = tasksViewModel::updateDraft,
                        onSubmit = tasksViewModel::submitDraft,
                    )
                }
            }

            if (state.decomposeTarget != null) {
                ModalBottomSheet(onDismissRequest = tasksViewModel::closeDecompose) {
                    DecomposeSheet(
                        state = state,
                        onHintChanged = tasksViewModel::setDecomposeHint,
                        onGenerate = tasksViewModel::generateSuggestions,
                        onConfirm = tasksViewModel::applySuggestions,
                    )
                }
            }
        }
    }
}

@Composable
private fun DateHeader(
    selectedDate: String,
    onPreviousDay: () -> Unit,
    onNextDay: () -> Unit,
) {
    Row(
        modifier = androidx.compose.ui.Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
    ) {
        OutlinedButton(onClick = onPreviousDay) {
            Text("前一天")
        }
        Text(
            text = selectedDate,
            style = MaterialTheme.typography.titleMedium,
        )
        OutlinedButton(onClick = onNextDay) {
            Text("后一天")
        }
    }
}

@Composable
private fun EmptyStateCard() {
    Surface(shape = RoundedCornerShape(28.dp)) {
        Column(modifier = androidx.compose.ui.Modifier.padding(24.dp)) {
            Text("今天还没有任务", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = androidx.compose.ui.Modifier.height(8.dp))
            Text("先添加一个时间块，把模糊计划变成可执行的下一步。")
        }
    }
}

@Composable
private fun TaskCard(
    task: Task,
    onStart: () -> Unit,
    onDone: () -> Unit,
    onReset: () -> Unit,
    onDelete: () -> Unit,
    onDecompose: () -> Unit,
) {
    Surface(shape = RoundedCornerShape(24.dp)) {
        Column(modifier = androidx.compose.ui.Modifier.padding(16.dp)) {
            Row(
                modifier = androidx.compose.ui.Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Column(modifier = androidx.compose.ui.Modifier.weight(1f)) {
                    Text(task.title, style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = androidx.compose.ui.Modifier.height(4.dp))
                    Text(
                        text = "${task.startTime.replace('T', ' ')} · ${task.durationMinutes} 分钟 · 能量 ${task.energyLevel}/5",
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                AssistChip(
                    onClick = {},
                    label = { Text(task.status.name) },
                )
            }

            Spacer(modifier = androidx.compose.ui.Modifier.height(12.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                IconButton(onClick = onStart) {
                    Icon(Icons.Rounded.PlayArrow, contentDescription = "开始")
                }
                IconButton(onClick = onDone) {
                    Icon(Icons.Rounded.Check, contentDescription = "完成")
                }
                IconButton(onClick = onReset) {
                    Icon(Icons.Rounded.PauseCircle, contentDescription = "重置")
                }
                IconButton(onClick = onDecompose) {
                    Icon(Icons.Rounded.AutoAwesome, contentDescription = "AI拆解")
                }
                IconButton(onClick = onDelete) {
                    Icon(Icons.Rounded.Delete, contentDescription = "删除")
                }
            }
        }
    }
}