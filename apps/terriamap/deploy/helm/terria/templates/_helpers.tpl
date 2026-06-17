{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "fullname" -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "dockerimage" -}}
{{- if .Values.image.full -}}
{{ .Values.image.full | quote }}
{{- else -}}
"{{ .Values.image.repository | default .Values.global.image.repository }}/{{ .Chart.Name }}:{{ .Values.image.tag | default .Values.global.image.tag | default "latest" }}"
{{- end -}}
{{- end -}}
